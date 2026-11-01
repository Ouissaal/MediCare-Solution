<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rendezvous extends Model
{
    protected $table = 'rendezvous';

    protected $fillable = [
        'patient_id',
        'medecin_id',
        'date_heure',
        'statut',
        'type_consultation',
        'motif',
        'symptomes',
        'ordonnance_precedente',
        'medicaments_actuels',
        'allergies',
        'notes_patient',
        'notes_medecin',
    ];

    protected $casts = [
        'date_heure' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function medecin()
    {
        return $this->belongsTo(Medecin::class);
    }
}
