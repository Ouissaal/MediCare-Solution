<?php

namespace App\Http\Controllers;

use App\Models\Disponibilite;
use App\Models\Medecin;
use App\Models\Rendezvous;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PatientController extends Controller
{
    // ===================RENDEZ-VOUS======================================================


    //GET /api/patient/rendezvous
    //List all appointments for the authenticated patient.
    public function mesRendezvous(Request $request): JsonResponse
    {
        $patient = $request->user()->patient;

        $rendezvous = Rendezvous::with(['medecin.user'])
            ->where('patient_id', $patient->id)
            ->orderBy('date_heure', 'desc')
            ->get()
            ->map(fn($rdv) => [
                'id'                    => $rdv->id,
                'date_heure'            => $rdv->date_heure,
                'statut'                => $rdv->statut,
                'type_consultation'     => $rdv->type_consultation,
                'motif'                 => $rdv->motif,
                'symptomes'             => $rdv->symptomes,
                'medicaments_actuels'   => $rdv->medicaments_actuels,
                'allergies'             => $rdv->allergies,
                'notes_patient'         => $rdv->notes_patient,
                'ordonnance_precedente' => $rdv->ordonnance_precedente,
                'notes_medecin'         => $rdv->notes_medecin,
                'medecin'               => [
                    'id'         => $rdv->medecin->id,
                    'nom'        => $rdv->medecin->user->nom,
                    'specialite' => $rdv->medecin->specialite,
                ],
            ]);

        return response()->json($rendezvous);
    }

    //POST /api/patient/rendezvous
    //Book a new appointment.
    //Body: { medecin_id, date_heure (Y-m-d H:i) }
    //Business rules:
    //  - Doctor must have a schedule covering that day & time
    //  - The hourly slot must not be full (max_patients_par_heure)
    //  - No double-booking for the same patient at the same time
    public function prendreRendezvous(Request $request): JsonResponse
    {
        $data = $request->validate([
            'medecin_id'            => 'required|integer|exists:medecins,id',
            'date_heure'            => 'required|date_format:Y-m-d H:i|after:now',
            'type_consultation'     => 'required|in:premiere_consultation,controle,suivi,urgence',
            'motif'                 => 'required|string|max:1000',
            'symptomes'             => 'nullable|string|max:2000',
            'ordonnance_precedente' => 'boolean',
            'medicaments_actuels'   => 'nullable|string|max:1000',
            'allergies'             => 'nullable|string|max:1000',
            'notes_patient'         => 'nullable|string|max:2000',
        ]);

        $patient    = $request->user()->patient;
        $dateHeure  = Carbon::createFromFormat('Y-m-d H:i', $data['date_heure']);

        // Carbon dayOfWeek: 0=Sunday … 6=Saturday → remap to 0=Monday … 6=Sunday
        $jourCarbon = $dateHeure->dayOfWeek;                          // 0=Sun
        $jourNotre  = $jourCarbon === 0 ? 6 : $jourCarbon - 1;       // 0=Mon…6=Sun

        // Check doctor has a schedule covering this time slot
        $disponibilite = Disponibilite::where('medecin_id', $data['medecin_id'])
            ->where('jour_semaine', $jourNotre)
            ->where('heure_debut', '<=', $dateHeure->format('H:i:s'))
            ->where('heure_fin', '>', $dateHeure->format('H:i:s'))
            ->first();

        if (!$disponibilite) {
            return response()->json([
                'message' => 'Le médecin n\'est pas disponible à ce créneau.',
            ], 422);
        }

        // Check that hourly capacity is not exceeded
        $debutHeure = $dateHeure->copy()->startOfHour();
        $finHeure   = $dateHeure->copy()->endOfHour();

        $nbExistants = Rendezvous::where('medecin_id', $data['medecin_id'])
            ->whereBetween('date_heure', [$debutHeure, $finHeure])
            ->whereNotIn('statut', ['ANNULE'])
            ->count();

        if ($nbExistants >= $disponibilite->max_patients_par_heure) {
            return response()->json([
                'message' => 'Ce créneau horaire est complet pour ce médecin.',
            ], 422);
        }

        // No double-booking for this patient at the exact same time
        $doublon = Rendezvous::where('patient_id', $patient->id)
            ->where('date_heure', $dateHeure)
            ->whereNotIn('statut', ['ANNULE'])
            ->exists();

        if ($doublon) {
            return response()->json([
                'message' => 'Vous avez déjà un rendez-vous à cette date et heure.',
            ], 422);
        }

        $rendezvous = Rendezvous::create([
            'patient_id'            => $patient->id,
            'medecin_id'            => $data['medecin_id'],
            'date_heure'            => $dateHeure,
            'statut'                => 'EN_ATTENTE',
            'type_consultation'     => $data['type_consultation'],
            'motif'                 => $data['motif'],
            'symptomes'             => $data['symptomes'] ?? null,
            'ordonnance_precedente' => $data['ordonnance_precedente'] ?? false,
            'medicaments_actuels'   => $data['medicaments_actuels'] ?? null,
            'allergies'             => $data['allergies'] ?? null,
            'notes_patient'         => $data['notes_patient'] ?? null,
        ]);

        return response()->json(
            $rendezvous->load(['medecin.user']),
            201
        );
    }

    //PUT /api/patient/rendezvous/{id}
    //Modify an appointment (only EN_ATTENTE, more than 12 hours away).
    public function modifierRendezvous(Request $request, int $id): JsonResponse
    {
        $patient    = $request->user()->patient;
        $rendezvous = Rendezvous::where('id', $id)
            ->where('patient_id', $patient->id)
            ->firstOrFail();

        if ($rendezvous->statut !== 'EN_ATTENTE') {
            return response()->json([
                'message' => 'Seul un rendez-vous en attente peut être modifié.',
            ], 422);
        }

        $heuresRestantes = Carbon::now()->diffInHours($rendezvous->date_heure, false);
        if ($heuresRestantes < 12) {
            return response()->json([
                'message' => 'Modification impossible : le rendez-vous est dans moins de 12 heures.',
            ], 422);
        }

        $data = $request->validate([
            'date_heure'            => 'sometimes|date_format:Y-m-d H:i|after:now',
            'type_consultation'     => 'sometimes|in:premiere_consultation,controle,suivi,urgence',
            'motif'                 => 'sometimes|string|max:1000',
            'symptomes'             => 'nullable|string|max:2000',
            'ordonnance_precedente' => 'boolean',
            'medicaments_actuels'   => 'nullable|string|max:1000',
            'allergies'             => 'nullable|string|max:1000',
            'notes_patient'         => 'nullable|string|max:2000',
        ]);

        if (isset($data['date_heure'])) {
            $dateHeure = Carbon::createFromFormat('Y-m-d H:i', $data['date_heure']);
            $jourCarbon = $dateHeure->dayOfWeek;
            $jourNotre  = $jourCarbon === 0 ? 6 : $jourCarbon - 1;

            $disponibilite = Disponibilite::where('medecin_id', $rendezvous->medecin_id)
                ->where('jour_semaine', $jourNotre)
                ->where('heure_debut', '<=', $dateHeure->format('H:i:s'))
                ->where('heure_fin',   '>',  $dateHeure->format('H:i:s'))
                ->first();

            if (!$disponibilite) {
                return response()->json([
                    'message' => 'Le médecin n\'est pas disponible à ce créneau.',
                ], 422);
            }

            $debutHeure = $dateHeure->copy()->startOfHour();
            $finHeure   = $dateHeure->copy()->endOfHour();

            $nbExistants = Rendezvous::where('medecin_id', $rendezvous->medecin_id)
                ->where('id', '!=', $id)
                ->whereBetween('date_heure', [$debutHeure, $finHeure])
                ->whereNotIn('statut', ['ANNULE'])
                ->count();

            if ($nbExistants >= $disponibilite->max_patients_par_heure) {
                return response()->json([
                    'message' => 'Ce créneau horaire est complet pour ce médecin.',
                ], 422);
            }

            $doublon = Rendezvous::where('patient_id', $patient->id)
                ->where('id', '!=', $id)
                ->where('date_heure', $dateHeure)
                ->whereNotIn('statut', ['ANNULE'])
                ->exists();

            if ($doublon) {
                return response()->json([
                    'message' => 'Vous avez déjà un rendez-vous à cette date et heure.',
                ], 422);
            }

            $data['date_heure'] = $dateHeure;
        }

        $rendezvous->update($data);

        return response()->json([
            'message'    => 'Rendez-vous modifié avec succès.',
            'rendezvous' => $rendezvous->fresh()->load(['medecin.user']),
        ]);
    }

    //DELETE /api/patient/rendezvous/{id}
    //Cancel an appointment (only if more than 12 hours away).
    public function annulerRendezvous(Request $request, int $id): JsonResponse
    {
        $patient    = $request->user()->patient;
        $rendezvous = Rendezvous::where('id', $id)
            ->where('patient_id', $patient->id)
            ->firstOrFail();

        if ($rendezvous->statut === 'ANNULE') {
            return response()->json(['message' => 'Ce rendez-vous est déjà annulé.'], 422);
        }

        if ($rendezvous->statut === 'CONFIRME') {
            return response()->json([
                'message' => 'Impossible d\'annuler un rendez-vous déjà confirmé par le médecin.',
            ], 422);
        }

        $rendezvous->update(['statut' => 'ANNULE']);

        return response()->json(['message' => 'Rendez-vous annulé avec succès.']);
    }

    // ===================PROFIL======================================================


    //PUT /api/patient/profil
    //Update phone and/or password.
    public function updateProfil(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'phone'                 => 'sometimes|string|max:20',
            'password'              => 'sometimes|string|min:6|confirmed',
            'password_confirmation' => 'sometimes|required_with:password',
        ]);

        if (isset($data['phone'])) {
            $user->phone = $data['phone'];
        }

        if (isset($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return response()->json(['message' => 'Profil mis à jour avec succès.', 'user' => $user]);
    }

    // ===================MÉDECINS (helpers for booking UI)======================================================


    //GET /api/patient/medecins
    //List all active doctors.
    public function listeMedecins(): JsonResponse
    {
        $medecins = Medecin::with('user')
            ->whereHas('user', fn($q) => $q->where('actif', true))
            ->get()
            ->map(fn($m) => [
                'id'         => $m->id,
                'nom'        => $m->user->nom,
                'specialite' => $m->specialite,
                'phone'      => $m->user->phone,
            ]);

        return response()->json($medecins);
    }

    //GET /api/patient/disponibilites-semaine
    //Return all doctors' availability for the current week with occupancy data.
    public function disponibilitesSemaine(): JsonResponse
    {
        $debutSemaine = Carbon::now()->startOfWeek(); // Monday

        $medecins = Medecin::with(['user', 'disponibilites'])
            ->whereHas('user', fn($q) => $q->where('actif', true))
            ->get();

        $result = [];

        foreach ($medecins as $medecin) {
            foreach ($medecin->disponibilites as $dispo) {
                // Find the concrete date for this weekday in the current week
                $jourDate = $debutSemaine->copy()->addDays($dispo->jour_semaine);

                // Count non-cancelled appointments on that date in this time range
                $booked = Rendezvous::where('medecin_id', $medecin->id)
                    ->whereDate('date_heure', $jourDate)
                    ->whereTime('date_heure', '>=', $dispo->heure_debut)
                    ->whereTime('date_heure', '<',  $dispo->heure_fin)
                    ->whereNotIn('statut', ['ANNULE'])
                    ->count();

                $capaciteTotale = $dispo->max_patients_par_heure;

                $placesDisponibles = max(0, $capaciteTotale - $booked);

                $result[] = [
                    'medecin_id'         => $medecin->id,
                    'nom'                => $medecin->user->nom,
                    'specialite'         => $medecin->specialite,
                    'jour_semaine'       => $dispo->jour_semaine,
                    'jour_label'         => Disponibilite::$jours[$dispo->jour_semaine],
                    'heure_debut'        => substr($dispo->heure_debut, 0, 5),
                    'heure_fin'          => substr($dispo->heure_fin, 0, 5),
                    'places_totales'     => $capaciteTotale,
                    'places_disponibles' => $placesDisponibles,
                    'statut'             => $placesDisponibles > 0 ? 'Disponible' : 'Complet',
                ];
            }
        }

        // Sort by day then start time
        usort($result, fn($a, $b) =>
            $a['jour_semaine'] !== $b['jour_semaine']
                ? $a['jour_semaine'] <=> $b['jour_semaine']
                : strcmp($a['heure_debut'], $b['heure_debut'])
        );

        return response()->json($result);
    }

    //GET /api/patient/medecins/{id}/disponibilites
    //Return the weekly schedule for a given doctor.
    public function disponibilitesMedecin(int $id): JsonResponse
    {
        $medecin = Medecin::findOrFail($id);

        $disponibilites = $medecin->disponibilites()
            ->orderBy('jour_semaine')
            ->orderBy('heure_debut')
            ->get()
            ->map(fn($d) => [
                'id'                    => $d->id,
                'jour_semaine'          => $d->jour_semaine,
                'jour_label'            => Disponibilite::$jours[$d->jour_semaine],
                'heure_debut'           => $d->heure_debut,
                'heure_fin'             => $d->heure_fin,
                'max_patients_par_heure' => $d->max_patients_par_heure,
            ]);

        return response()->json($disponibilites);
    }
}
