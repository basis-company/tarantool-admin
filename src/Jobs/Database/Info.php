<?php

namespace Jobs\Database;

class Info extends Job
{
    public function run()
    {
        $mapper = $this->getMapper();

        $stat = $mapper->getClient()->evaluate('return box.stat()')->getData()[0];
        $slab = $mapper->getClient()->evaluate('return box.slab.info()')->getData()[0];

        return compact('stat', 'slab');
    }
}