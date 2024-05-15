<?php

namespace Job\Database;

use Exception;

class Info extends Job
{
    public function run(): array
    {
        $client = $this->getMapper()->client;

        $stats = [
            'info' => 'box.info',
            'stat' => 'box.stat',
            'slab' => 'box.slab.info',
        ];

        $info = [];
        foreach ($stats as $k => $function) {
            try {
                $info[$k] = $client->call($function)[0];
            } catch (Exception) {
            }
        }

        return $info;
    }
}
