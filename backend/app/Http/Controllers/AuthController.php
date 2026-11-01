<?php

namespace App\Http\Controllers;

use App\Models\Administrateur;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nom'                   => 'required|string|max:255',
            'email'                 => 'required|email|unique:users,email',
            'phone'                 => 'required|string|max:20',
            'password'              => 'required|string|min:6|confirmed',
// confiremed mean => required the password_confirmation 
            'password_confirmation' => 'required',
            'role'                  => 'required|in:patient,medecin,admin',
            'specialite'            => 'required_if:role,medecin|nullable|string|max:255',
        ]);

        $user = User::create([
            'nom'      => $data['nom'],
            'email'    => $data['email'],
            'phone'    => $data['phone'],
            'password' => $data['password'],
            'role'     => $data['role'],
        ]);

        match ($user->role) {
            'patient' => Patient::create(['user_id' => $user->id]),
            'medecin' => Medecin::create(['user_id' => $user->id, 'specialite' => $data['specialite'] ?? '']),
            'admin'   => Administrateur::create(['user_id' => $user->id]),
        };

        $token = $user->createToken('auth_token')->plainTextToken;
        // generates api token for authentification

        return response()->json([
            'message' => 'Inscription réussie.',
            'user'    => $user,
            'token'   => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);
      // find user
        $user = User::where('email', $data['email'])->first(); 

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Email ou mot de passe incorrect.'], 401);
        }

        if (!$user->actif) {
            return response()->json(['message' => 'Votre compte a été désactivé.'], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Connexion réussie.',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        //Retrieves the currently authenticated user, Gets the token used in THIS request, delete the token from db
        $request->user()->currentAccessToken()->delete();  
        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $profile = match ($user->role) {
            'patient' => $user->load('patient'),
            'medecin' => $user->load('medecin'),
            'admin'   => $user->load('administrateur'),
            default   => $user,
        };


        return response()->json($profile);
    }
// nb: load() fetches related data (relationship)
}
