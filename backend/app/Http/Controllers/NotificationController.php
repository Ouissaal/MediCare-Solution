<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // ===================NOTIFICATIONS======================================================


    //GET /api/notifications
    //Return all notifications for the authenticated user (newest first).
    public function index(Request $request): JsonResponse
    {
        $notifications = Notification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'notifications' => $notifications,
            'non_lues'      => $notifications->where('lu', false)->count(),
        ]);
    }

    //PUT /api/notifications/{id}/lire
    //Mark a single notification as read.
    public function marquerLue(Request $request, int $id): JsonResponse
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->update(['lu' => true]);

        return response()->json(['message' => 'Notification marquée comme lue.']);
    }

    //PUT /api/notifications/tout-lire
    //Mark all notifications as read.
    public function toutLire(Request $request): JsonResponse
    {
        Notification::where('user_id', $request->user()->id)
            ->where('lu', false)
            ->update(['lu' => true]);

        return response()->json(['message' => 'Toutes les notifications marquées comme lues.']);
    }
}
