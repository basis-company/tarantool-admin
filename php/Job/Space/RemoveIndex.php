<?php

namespace Job\Space;

class RemoveIndex extends Job
{
    public string $name;

    public function run(): void
    {
        $space = $this->getSpace();
        $space->removeIndex($this->name);
    }
}
