<?php

namespace Jobs\Space;

class Info extends Job
{
    public function run()
    {
        $space = $this->getSpace();

        $format = $space->getFormat();
        $indexes = $space->getIndexes();

        return compact('format', 'indexes');
    }
}