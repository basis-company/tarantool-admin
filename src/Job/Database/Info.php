<?php

namespace Job\Database;

class Info extends Job
{
    public function run()
    {
        $mapper = $this->getMapper();

        $info = $mapper->getClient()->evaluate('return box.info()')->getData()[0];
        $stat = $mapper->getClient()->evaluate('return box.stat()')->getData()[0];
        $slab = $mapper->getClient()->evaluate('return box.slab.info()')->getData()[0];

        return compact('info', 'stat', 'slab');
    }
}
