<?php

namespace Job\Database;

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
            $spaces[] = $space;
        }

        return compact('spaces');
    }
}
