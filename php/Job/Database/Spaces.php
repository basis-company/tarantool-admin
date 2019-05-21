<?php

namespace Job\Database;

use Exception;

class Spaces extends Job
{
    public function run()
    {
        $mapper = $this->getMapper();

        $spaces = [];
        foreach ($mapper->find('_vspace') as $space) {
            try {
                if (!in_array($space->engine, ['sysview', 'blackhole', 'vinyl'])) {
                    $space->count = $mapper->getClient()->call("box.space.$space->name:count")[0];
                }
                $space->bsize = $mapper->getClient()->call("box.space.$space->name:bsize")[0];
            } catch (Exception $e) {
            }
            $spaces[] = $space;
        }

        return compact('spaces');
    }
}
