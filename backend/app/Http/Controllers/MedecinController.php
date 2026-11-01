<?php

namespace App\Http\Controllers;

use App\Models\Disponibilite;
use App\Models\Notification;
use App\Models\Rendezvous;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedecinController extends Controller
{

    // ===================DISPONIBILITÉS (PLANNING HEBDOMADAIRE)======================================================


    //GET /api/medecin/disponibilites
    //Return the doctor's full weekly schedule.
    
    public function mesDisponibilites(Request $request): JsonResponse
    {
        $medecin = $request->user()->medecin;

        $disponibilites = $medecin->disponibilites()
            ->orderBy('jour_semaine')
            ->orderBy('heure_debut')
            ->get()
            ->map(fn($d) => [
                'id'                     => $d->id,
                'jour_semaine'           => $d->jour_semaine,
                'jour_label'             => Disponibilite::$jours[$d->jour_semaine],
                'heure_debut'            => $d->heure_debut,
                'heure_fin'              => $d->heure_fin,
                'max_patients_par_heure' => $d->max_patients_par_heure,
            ]);

        return response()->json($disponibilites);
    }

    //POST /api/medecin/disponibilites
    //Create a new time slot in the weekly schedule.
    //Body: { jour_semaine(0-6), heure_debut(H:i), heure_fin(H:i), max_patients_par_heure }
    public function creerDisponibilite(Request $request): JsonResponse
    {
        $data = $request->validate([
            'jour_semaine'           => 'required|integer|min:0|max:6',
            'heure_debut'            => 'required|date_format:H:i',
            'heure_fin'              => 'required|date_format:H:i|after:heure_debut',
            'max_patients_par_heure' => 'required|integer|min:1|max:20',
        ]);

        $medecin = $request->user()->medecin;

        // Prevent overlapping slots on the same day
        $chevauchement = Disponibilite::where('medecin_id', $medecin->id)
            ->where('jour_semaine', $data['jour_semaine'])
            ->where(function ($q) use ($data) {
                $q->where(function ($q2) use ($data) {
                    // Existing slot starts inside new slot
                    $q2->where('heure_debut', '>=', $data['heure_debut'])
                       ->where('heure_debut', '<',  $data['heure_fin']);
                })->orWhere(function ($q2) use ($data) {
                    // Existing slot ends inside new slot
                    $q2->where('heure_fin', '>', $data['heure_debut'])
                       ->where('heure_fin', '<=', $data['heure_fin']);
                })->orWhere(function ($q2) use ($data) {
                    // Existing slot fully wraps new slot
                    $q2->where('heure_debut', '<=', $data['heure_debut'])
                       ->where('heure_fin', '>=', $data['heure_fin']);
                });
            })
            ->exists();

        if ($chevauchement) {
            return response()->json([
                'message' => 'Ce créneau chevauche une disponibilité existante pour ce jour.',
            ], 422);
        }

        $disponibilite = Disponibilite::create([
            'medecin_id'             => $medecin->id,
            'jour_semaine'           => $data['jour_semaine'],
            'heure_debut'            => $data['heure_debut'],
            'heure_fin'              => $data['heure_fin'],
            'max_patients_par_heure' => $data['max_patients_par_heure'],
        ]);

        return response()->json([
            'message'       => 'Disponibilité créée.',
            'disponibilite' => array_merge($disponibilite->toArray(), [
                'jour_label' => Disponibilite::$jours[$disponibilite->jour_semaine],
            ]),
        ], 201);
    }

    //PUT /api/medecin/disponibilites/{id}
    //Update an existing schedule slot (only the doctor's own slots).
    public function updateDisponibilite(Request $request, int $id): JsonResponse
    {
        $medecin       = $request->user()->medecin;
        $disponibilite = Disponibilite::where('id', $id)
            ->where('medecin_id', $medecin->id)
            ->firstOrFail();

        $data = $request->validate([
            'jour_semaine'           => 'sometimes|integer|min:0|max:6',
            'heure_debut'            => 'sometimes|date_format:H:i',
            'heure_fin'              => 'sometimes|date_format:H:i',
            'max_patients_par_heure' => 'sometimes|integer|min:1|max:20',
        ]);

        $disponibilite->update($data);

        return response()->json([
            'message'       => 'Disponibilité mise à jour.',
            'disponibilite' => array_merge($disponibilite->fresh()->toArray(), [
                'jour_label' => Disponibilite::$jours[$disponibilite->jour_semaine],
            ]),
        ]);
    }

    //DELETE /api/medecin/disponibilites/{id}
    //Remove a schedule slot (only the doctor's own slots).
    public function supprimerDisponibilite(Request $request, int $id): JsonResponse
    {
        $medecin       = $request->user()->medecin;
        $disponibilite = Disponibilite::where('id', $id)
            ->where('medecin_id', $medecin->id)
            ->firstOrFail();

        $disponibilite->delete();

        return response()->json(['message' => 'Disponibilité supprimée.']);
    }

    // ===================RENDEZ-VOUS======================================================


    //GET /api/medecin/rendezvous
    //List the doctor's appointments. Optional filters: ?date=Y-m-d, ?statut=...
    public function mesRendezvous(Request $request): JsonResponse
    {
        $medecin = $request->user()->medecin;

        $query = Rendezvous::with(['patient.user'])
            ->where('medecin_id', $medecin->id);

        if ($request->filled('date')) {
            $query->whereDate('date_heure', $request->date);
        }

        if ($request->filled('statut')) {
            $query->where('statut', strtoupper($request->statut));
        }

        $rendezvous = $query->orderBy('date_heure')->get()
            ->map(fn($rdv) => [
                'id'                    => $rdv->id,
                'date_heure'            => $rdv->date_heure,
                'statut'                => $rdv->statut,
                'type_consultation'     => $rdv->type_consultation,
                'motif'                 => $rdv->motif,
                'symptomes'             => $rdv->symptomes,
                'ordonnance_precedente' => $rdv->ordonnance_precedente,
                'medicaments_actuels'   => $rdv->medicaments_actuels,
                'allergies'             => $rdv->allergies,
                'notes_patient'         => $rdv->notes_patient,
                'notes_medecin'         => $rdv->notes_medecin,
                'patient'               => [
                    'id'    => $rdv->patient->id,
                    'nom'   => $rdv->patient->user->nom,
                    'phone' => $rdv->patient->user->phone,
                    'email' => $rdv->patient->user->email,
                ],
            ]);

        return response()->json($rendezvous);
    }

    //PUT /api/medecin/rendezvous/{id}/statut
    //Update appointment status: CONFIRME | ANNULE
    //Body: { statut }
    public function updateStatut(Request $request, int $id): JsonResponse
    {
        $medecin    = $request->user()->medecin;
        $rendezvous = Rendezvous::where('id', $id)
            ->where('medecin_id', $medecin->id)
            ->firstOrFail();

        $rendezvous->load('patient');

        $data = $request->validate([
            'statut' => 'required|in:CONFIRME,ANNULE',
        ]);

        if ($rendezvous->statut === 'ANNULE') {
            return response()->json(['message' => 'Ce rendez-vous est déjà annulé.'], 422);
        }

        $rendezvous->update(['statut' => $data['statut']]);

        // Notify the patient
        $date       = Carbon::parse($rendezvous->date_heure)->format('d/m/Y à H:i');
        $nomMedecin = $request->user()->nom;

        $messages = [
            'CONFIRME' => " Votre rendez-vous du {$date} avec Dr. {$nomMedecin} a été confirmé.",
            'ANNULE'   => " Votre rendez-vous du {$date} avec Dr. {$nomMedecin} a été annulé.",
        ];

        $types = ['CONFIRME' => 'success', 'ANNULE' => 'warning'];

        if (isset($messages[$data['statut']])) {
            Notification::create([
                'user_id' => $rendezvous->patient->user_id,
                'message' => $messages[$data['statut']],
                'type'    => $types[$data['statut']],
            ]);
        }

        return response()->json([
            'message'    => 'Statut mis à jour.',
            'rendezvous' => $rendezvous->fresh(),
        ]);
    }

    //PUT /api/medecin/rendezvous/{id}/notes
    //Save or update the doctor's notes for an appointment.
    //Body: { notes_medecin }
    public function updateNotes(Request $request, int $id): JsonResponse
    {
        $medecin    = $request->user()->medecin;
        $rendezvous = Rendezvous::where('id', $id)
            ->where('medecin_id', $medecin->id)
            ->firstOrFail();

        $data = $request->validate([
            'notes_medecin' => 'nullable|string|max:5000',
        ]);

        $rendezvous->update(['notes_medecin' => $data['notes_medecin'] ?? null]);

        return response()->json(['message' => 'Notes sauvegardées.', 'rendezvous' => $rendezvous->fresh()]);
    }

    // ===================PLANNING SEMAINE (calendrier)======================================================


    //GET /api/medecin/planning-semaine
    //Return a per-day view of the current week: slots, booked count, remaining spots.
    public function planningSemaine(Request $request): JsonResponse
    {
        $medecin      = $request->user()->medecin;
        $debutSemaine = Carbon::now()->startOfWeek(); // Monday

        $jours = [];

        for ($i = 0; $i < 7; $i++) {
            $jourDate = $debutSemaine->copy()->addDays($i);

            $dispos = $medecin->disponibilites()
                ->where('jour_semaine', $i)
                ->orderBy('heure_debut')
                ->get();

            $creneaux      = [];
            $totalCapacite = 0;
            $totalBooked   = 0;

            foreach ($dispos as $dispo) {
                $booked = Rendezvous::where('medecin_id', $medecin->id)
                    ->whereDate('date_heure', $jourDate)
                    ->whereTime('date_heure', '>=', $dispo->heure_debut)
                    ->whereTime('date_heure', '<',  $dispo->heure_fin)
                    ->whereNotIn('statut', ['ANNULE'])
                    ->count();

                $capacite  = $dispo->max_patients_par_heure;

                $totalCapacite += $capacite;
                $totalBooked   += $booked;

                $creneaux[] = [
                    'id'                     => $dispo->id,
                    'heure_debut'            => substr($dispo->heure_debut, 0, 5),
                    'heure_fin'              => substr($dispo->heure_fin, 0, 5),
                    'max_patients_par_heure' => $dispo->max_patients_par_heure,
                    'capacite_totale'        => $capacite,
                    'patients_programmes'    => $booked,
                    'places_restantes'       => max(0, $capacite - $booked),
                ];
            }

            $jours[] = [
                'jour_semaine'          => $i,
                'jour_label'            => Disponibilite::$jours[$i],
                'date'                  => $jourDate->format('Y-m-d'),
                'date_display'          => $jourDate->format('d/m'),
                'disponible'            => $dispos->isNotEmpty(),
                'creneaux'              => $creneaux,
                'total_patients'        => $totalBooked,
                'total_places_restantes'=> max(0, $totalCapacite - $totalBooked),
                'total_capacite'        => $totalCapacite,
            ];
        }

        return response()->json($jours);
    }

    // ===================STATISTIQUES======================================================


    //GET /api/medecin/stats
    //Personal stats: patients today, patients this week.
    public function stats(Request $request): JsonResponse
    {
        $medecin      = $request->user()->medecin;
        $today        = Carbon::today();
        $debutSemaine = Carbon::now()->startOfWeek();
        $finSemaine   = Carbon::now()->endOfWeek();

        // Total distinct patients who have had at least one non-cancelled appointment
        $totalPatients = Rendezvous::where('medecin_id', $medecin->id)
            ->whereNotIn('statut', ['ANNULE'])
            ->distinct('patient_id')
            ->count('patient_id');

        // Total appointments (all statuses)
        $totalRendezvous = Rendezvous::where('medecin_id', $medecin->id)->count();

        $patientsAujourdhui = Rendezvous::where('medecin_id', $medecin->id)
            ->whereDate('date_heure', $today)
            ->whereNotIn('statut', ['ANNULE'])
            ->count();

        $patientsSemaine = Rendezvous::where('medecin_id', $medecin->id)
            ->whereBetween('date_heure', [$debutSemaine, $finSemaine])
            ->whereNotIn('statut', ['ANNULE'])
            ->count();

        $rendezvousAVenir = Rendezvous::where('medecin_id', $medecin->id)
            ->where('date_heure', '>', Carbon::now())
            ->whereIn('statut', ['EN_ATTENTE', 'CONFIRME'])
            ->count();

        $rendezvousEnAttente = Rendezvous::where('medecin_id', $medecin->id)
            ->where('statut', 'EN_ATTENTE')
            ->count();

        // Max patients per hour across all availability slots
        $maxPatientsParHeure = \App\Models\Disponibilite::where('medecin_id', $medecin->id)
            ->max('max_patients_par_heure') ?? 0;

        return response()->json([
            'total_patients'         => $totalPatients,
            'total_rendezvous'       => $totalRendezvous,
            'patients_aujourd_hui'   => $patientsAujourdhui,
            'patients_cette_semaine' => $patientsSemaine,
            'rendezvous_a_venir'     => $rendezvousAVenir,
            'rendezvous_en_attente'  => $rendezvousEnAttente,
            'max_patients_par_heure' => $maxPatientsParHeure,
        ]);
    }
}
