<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    //Handle an incoming request.
    //Usage: middleware('role:patient'), middleware('role:medecin,admin')
    //...$roles = accept multiple roles
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Non authentifié.'], 401);
        }

        if (!$user->actif) {
            return response()->json(['message' => 'Compte désactivé.'], 403);
        }

        if (!in_array($user->role, $roles)) {
            return response()->json([
                'message' => 'Accès non autorisé. Rôle requis : ' . implode(' ou ', $roles),
            ], 403);
        }

        return $next($request);
    }
}
