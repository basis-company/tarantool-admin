<?php

namespace Job\Space;

use Exception;

class RemoveIndex extends Job
{
    public string $name;

    public function run(): void
    {
        $space = $this->getSpace();
        $spaceName = $space->getName();
        $indexExist = false;
        foreach ($space->mapper->find('_vindex', ['id' => $space->getId()]) as $index) {
            if ($index['name'] == $this->name) {
                $space->mapper->client->call("box.space.$spaceName.index.$this->name:drop");
                $indexExist = true;
            }
        }
        if (!$indexExist) {
            throw new Exception("Index $this->name not found");
        }
    }
}
