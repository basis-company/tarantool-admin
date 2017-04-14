<?php

namespace Jobs\Space;

class Drop extends Job
{
    public function run()
    {
        $space = $this->getSpace();
        if($space->owner) {
            throw new Exception('Disabled for system spaces');
        }

        $this->getClient()->evaluate('box.space.'.$space->getName().':drop()');
    }
}