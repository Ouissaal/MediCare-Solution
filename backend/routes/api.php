<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MedecinController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PatientController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — MediCare Solutions
|--------------------------------------------------------------------------
|
| Statuses used in rendezvous:
|   EN_ATTENTE | CONFIRME | ANNULE
|
| Roles: patient | medecin | admin
|
*/

// ---------------------------------------------------------------------------
// PUBLIC — Authentication
// ---------------------------------------------------------------------------
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// ---------------------------------------------------------------------------
// PROTECTED — Requires valid Sanctum token
// ---------------------------------------------------------------------------
Route::middleware('auth:sanctum')->group(function () {

    // Auth helpers
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Notifications (tous rôles)
    Route::get('/notifications',              [NotificationController::class, 'index']);
    Route::put('/notifications/tout-lire',    [NotificationController::class, 'toutLire']);
    Route::put('/notifications/{id}/lire',    [NotificationController::class, 'marquerLue']);

    // -----------------------------------------------------------------------
    // PATIENT
    // -----------------------------------------------------------------------
    Route::middleware('role:patient')
        ->prefix('patient')
        ->group(function () {
            // Appointments
            Route::get('/rendezvous',         [PatientController::class, 'mesRendezvous']);
            Route::post('/rendezvous',        [PatientController::class, 'prendreRendezvous']);
            Route::put('/rendezvous/{id}',    [PatientController::class, 'modifierRendezvous']);
            Route::delete('/rendezvous/{id}', [PatientController::class, 'annulerRendezvous']);

            // Profile
            Route::put('/profil', [PatientController::class, 'updateProfil']);

            // Browse doctors
            Route::get('/medecins',                         [PatientController::class, 'listeMedecins']);
            Route::get('/medecins/{id}/disponibilites',     [PatientController::class, 'disponibilitesMedecin']);
            Route::get('/disponibilites-semaine',           [PatientController::class, 'disponibilitesSemaine']);

        });

    // -----------------------------------------------------------------------
    // MÉDECIN
    // -----------------------------------------------------------------------
    Route::middleware('role:medecin')
        ->prefix('medecin')
        ->group(function () {
            // Weekly schedule
            Route::get('/disponibilites',          [MedecinController::class, 'mesDisponibilites']);
            Route::post('/disponibilites',         [MedecinController::class, 'creerDisponibilite']);
            Route::put('/disponibilites/{id}',     [MedecinController::class, 'updateDisponibilite']);
            Route::delete('/disponibilites/{id}',  [MedecinController::class, 'supprimerDisponibilite']);

            // Appointments
            Route::get('/rendezvous',              [MedecinController::class, 'mesRendezvous']);
            Route::put('/rendezvous/{id}/statut',  [MedecinController::class, 'updateStatut']);
            Route::put('/rendezvous/{id}/notes',   [MedecinController::class, 'updateNotes']);

            // Stats
            Route::get('/stats',           [MedecinController::class, 'stats']);
            Route::get('/planning-semaine',[MedecinController::class, 'planningSemaine']);

        });

    // -----------------------------------------------------------------------
    // ADMIN
    // -----------------------------------------------------------------------
    Route::middleware('role:admin')
        ->prefix('admin')
        ->group(function () {
            // Doctors
            Route::get('/medecins',         [AdminController::class, 'listeMedecins']);
            Route::post('/medecins',        [AdminController::class, 'creerMedecin']);
            Route::put('/medecins/{id}',    [AdminController::class, 'updateMedecin']);
            Route::delete('/medecins/{id}', [AdminController::class, 'supprimerMedecin']);

            // Specialties
            Route::get('/specialites', [AdminController::class, 'specialites']);

            // Appointments
            Route::get('/rendezvous',                 [AdminController::class, 'tousRendezvous']);
            Route::put('/rendezvous/{id}/annuler',    [AdminController::class, 'annulerRendezvous']);

            // Users
            Route::get('/utilisateurs',                       [AdminController::class, 'listeUtilisateurs']);
            Route::put('/utilisateurs/{id}/toggle-actif',     [AdminController::class, 'toggleActif']);
            Route::put('/utilisateurs/{id}/role',             [AdminController::class, 'updateRole']);

            // Dashboard stats
            Route::get('/stats', [AdminController::class, 'stats']);
        });
});
