<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medecin extends Model
{
    protected $fillable = ['user_id', 'specialite'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function disponibilites()
    {
        return $this->hasMany(Disponibilite::class);
    }

    public function rendezvous()
    {
        return $this->hasMany(Rendezvous::class);
    }
}
