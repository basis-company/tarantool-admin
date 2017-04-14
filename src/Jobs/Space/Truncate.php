<?php

namespace Jobs\Space;

class Truncate extends Job
{
    public function run()
    {
        $space = $this->getSpace();
        if($space->owner) {
            throw new Exception('Disabled for system spaces');
        }

        $this->getClient()->evaluate('box.space.'.$space->getName().':truncate()');
    }
}