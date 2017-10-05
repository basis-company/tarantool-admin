<?php

namespace Job\Database;

use Exception;

class Spaces extends Job
{
    public function run()
    {
        $mapper = $this->getMapper();

        $spaces = [];
        foreach($mapper->find('_vspace') as $space) {
            if($space->engine != 'sysview') {
                $space->count = $mapper->getClient()->evaluate("return box.space.$space->name:count()")->getData()[0];
            }
            try {
                $space->bsize = $mapper->getClient()->evaluate("return box.space.$space->name:bsize()")->getData()[0];
            } catch (Exception $e) {
            }
            $spaces[] = $space;
        }

        return compact('spaces');
    }
}
