<?php

namespace Job\Database;

use Exception;

class Info extends Job
{
    public function run()
    {
        $client = $this->getMapper()->getClient();

        $stats = [
            'info' => 'box.info',
            'stat' => 'box.stat',
            'slab' => 'box.slab.info',
        ];

        $info = [];
        foreach ($stats as $k => $function) {
            try {
                $info[$k] = $client->call($function)[0];
            } catch (Exception $e) {}
        }

        return $info;
    }
}
