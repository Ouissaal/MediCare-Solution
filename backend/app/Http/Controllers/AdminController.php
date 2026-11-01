<?php

namespace App\Http\Controllers;

use App\Models\Administrateur;
use App\Models\Medecin;
use App\Models\Patient;
use Illuminate\Support\Facades\Hash;
use App\Models\Rendezvous;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
// clear: we use JsonResponse to ensure the method returns a JSON response
use Illuminate\Http\Request;

class AdminController extends Controller
{

//  ===================MÉDECINS==========================

    // route :  GET /api/admin/medecins
    // List all doctors with their user info.

    public function listeMedecins(): JsonResponse
    {
        $medecins = Medecin::with('user')
            ->get()
            ->map(fn($m) => [
                'id'         => $m->id,
                'user_id'    => $m->user_id,
                'nom'        => $m->user->nom,
                'email'      => $m->user->email,
                'phone'      => $m->user->phone,
                'specialite' => $m->specialite,
                'actif'      => $m->user->actif,
            ]);

        return response()->json($medecins);
    }

    
    // route : POST /api/admin/medecins
    // Create a new doctor account.
    // Body: { nom, email, phone, password, specialite }
     
    public function creerMedecin(Request $request): JsonResponse
    {
        // validation part
        $data = $request->validate([
            'nom'        => 'required|string|max:255',
            'email'      => 'required|email|unique:users,email',
            'phone'      => 'required|string|max:20',
            'password'   => 'required|string|min:6',
            'specialite' => 'required|string|max:255',
        ]);

        $user = User::create([
            'nom'      => $data['nom'],
            'email'    => $data['email'],
            'phone'    => $data['phone'],
            'password' => $data['password'],
            'role'     => 'medecin',
        ]);

        $medecin = Medecin::create([
            'user_id'    => $user->id,
            'specialite' => $data['specialite'],
        ]);

        return response()->json([
            'message' => 'Médecin créé avec succès.',
            'medecin' => [
                'id'         => $medecin->id,
                'nom'        => $user->nom,
                'email'      => $user->email,
                'phone'      => $user->phone,
                'specialite' => $medecin->specialite,
            ],
        ], 201);
    }

    //PUT /api/admin/medecins/{id}
    // Update doctor info.
    // Body: { nom?, phone?, specialite? }
    
    public function updateMedecin(Request $request, int $id): JsonResponse
    {
        $medecin = Medecin::with('user')->findOrFail($id);

        // sometimes => optional field: validated only if present in the request :

        $data = $request->validate([
            'nom'        => 'sometimes|string|max:255',
            'phone'      => 'sometimes|string|max:20',
            'specialite' => 'sometimes|string|max:255',
        ]);

        if (isset($data['nom']))   $medecin->user->nom   = $data['nom'];
        if (isset($data['phone'])) $medecin->user->phone = $data['phone'];
        $medecin->user->save();

        if (isset($data['specialite'])) {
            $medecin->specialite = $data['specialite'];
            $medecin->save();
        }

        return response()->json(['message' => 'Médecin mis à jour avec succès.']);
    }

    
    // DELETE /api/admin/medecins/{id}
    // Delete a doctor and their user account.
    
    public function supprimerMedecin(int $id): JsonResponse
    {
        $medecin = Medecin::with('user')->findOrFail($id);
        $user    = $medecin->user;

        $medecin->delete();
        $user->delete();

        return response()->json(['message' => 'Médecin supprimé avec succès.']);
    }

   
    // =========================RENDEZ-VOUS=========================
    

   
    //GET /api/admin/rendezvous
    //List all appointments with optional filters.
    // Query params: ?date=Y-m-d, ?medecin_id=, ?statut=

    public function tousRendezvous(Request $request): JsonResponse
    {
        $query = Rendezvous::with(['patient.user', 'medecin.user']);

        if ($request->filled('date')) {
            $query->whereDate('date_heure', $request->date);
        }

        if ($request->filled('medecin_id')) {
            $query->where('medecin_id', $request->medecin_id);
        }

        if ($request->filled('statut')) {
            $query->where('statut', strtoupper($request->statut));
        }

        $rendezvous = $query->orderBy('date_heure', 'desc')
            ->get()
            ->map(fn($rdv) => [
                'id'         => $rdv->id,
                'date_heure' => $rdv->date_heure,
                'statut'     => $rdv->statut,
                'patient'    => [
                    'id'    => $rdv->patient->id,
                    'nom'   => $rdv->patient->user->nom,
                    'email' => $rdv->patient->user->email,
                ],
                'medecin'    => [
                    'id'         => $rdv->medecin->id,
                    'nom'        => $rdv->medecin->user->nom,
                    'specialite' => $rdv->medecin->specialite,
                ],
            ]);

        return response()->json($rendezvous);
    }

    
    //PUT /api/admin/rendezvous/{id}/annuler
    // Cancel any appointment.
    
    public function annulerRendezvous(int $id): JsonResponse
    {
        $rendezvous = Rendezvous::findOrFail($id);

        if ($rendezvous->statut === 'ANNULE') {
            return response()->json(['message' => 'Ce rendez-vous est déjà annulé.'], 422); // NB: 422 => Valid request but cannot be processed(business logic)
        }

        $rendezvous->update(['statut' => 'ANNULE']);

        return response()->json(['message' => 'Rendez-vous annulé avec succès.']);
    }


    // ==============================UTILISATEURS ==============================
    
    // GET /api/admin/utilisateurs
    // List all users. Optional filter: ?role=patient|medecin|admin

    public function listeUtilisateurs(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('role')) {
            $request->validate(['role' => 'in:patient,medecin,admin']);
            $query->where('role', $request->role);
        }

        return response()->json($query->orderBy('nom')->get());
    }

    
    // PUT /api/admin/utilisateurs/{id}/role
    // Change the role of a user. Creates the matching profile if needed.
    //Body: { role: 'patient'|'medecin'|'admin', specialite? }
     
    public function updateRole(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas modifier votre propre rôle.'], 422);
        }

        $data = $request->validate([
            'role'       => 'required|in:patient,medecin,admin',
            'specialite' => 'required_if:role,medecin|nullable|string|max:255',
        ]);

        $ancienRole  = $user->role;
        $nouveauRole = $data['role'];

        if ($ancienRole === $nouveauRole) {
            return response()->json(['message' => 'L\'utilisateur a déjà ce rôle.'], 422);
        }

        // Create the new profile record if it doesn't exist yet
        match ($nouveauRole) {
            'patient' => Patient::firstOrCreate(['user_id' => $user->id]),
            'medecin' => Medecin::firstOrCreate(
                ['user_id' => $user->id],
                ['specialite' => $data['specialite'] ?? '']
            ),
            'admin' => Administrateur::firstOrCreate(['user_id' => $user->id]),
        };

        $user->role = $nouveauRole;
        $user->save();

        return response()->json([
            'message' => "Rôle modifié : {$ancienRole} → {$nouveauRole}.",
            'user'    => $user->fresh(),
        ]);
    }

    
    // PUT /api/admin/utilisateurs/{id}/toggle-actif
    //Enable or disable a user account.
     
    public function toggleActif(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Prevent disabling own account
        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas désactiver votre propre compte.'], 422);
        }

        $user->actif = !$user->actif;
        $user->save();

        $statut = $user->actif ? 'activé' : 'désactivé';

        return response()->json([
            'message' => "Utilisateur {$statut} avec succès.",
            'actif'   => $user->actif,
        ]);
    }

    // ====================================STATISTIQUES DU TABLEAU DE BORD=====================================

    
    //GET /api/admin/stats
    //Dashboard statistics.
    
    public function stats(): JsonResponse
    {
        $today = Carbon::today();

        return response()->json([
            'total_patients'          => Patient::count(),
            'total_medecins'          => Medecin::count(),
            'rendezvous_aujourd_hui'  => Rendezvous::whereDate('date_heure', $today)->count(),
            'rendezvous_annules'      => Rendezvous::where('statut', 'ANNULE')->count(),
            'rendezvous_en_attente'   => Rendezvous::where('statut', 'EN_ATTENTE')->count(),
            'rendezvous_confirmes'    => Rendezvous::where('statut', 'CONFIRME')->count(),
            'total_rendezvous'        => Rendezvous::count(),
        ]);
    }


    // =============================SPÉCIALITÉS (liste unique depuis les médecins)============================================

    
    //GET /api/admin/specialites
    //Return all distinct specialties currently used.
    
    public function specialites(): JsonResponse
    {
        $specialites = Medecin::select('specialite')
            ->distinct()    // // remove duplicates
            ->orderBy('specialite')
            ->pluck('specialite') /// extract values into a simple array
            ->filter()   // remove null/empty values
            ->values();   // reset indexes (0 => "cardiologie",)

        return response()->json($specialites);
    }
}
