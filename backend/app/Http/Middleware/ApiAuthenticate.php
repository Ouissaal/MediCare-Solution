<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiAuthenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearerToken = $request->bearerToken();

        if (!$bearerToken) {
            return response()->json(['message' => 'Non authentifié. Token manquant.'], 401);
        }

        // Comparer le token reçu (hashé) avec celui en base
        $user = User::where('api_token', hash('sha256', $bearerToken))->first();

        if (!$user) {
            return response()->json(['message' => 'Token invalide ou expiré.'], 401);
        }

        if (!$user->actif) {
            return response()->json(['message' => 'Compte désactivé.'], 403);
        }

        // Injecter l'utilisateur dans la requête
        $request->setUserResolver(fn() => $user);
        auth()->setUser($user);

        return $next($request);
    }
}
