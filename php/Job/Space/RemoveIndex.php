<?php

namespace Job\Space;

use Exception;

class RemoveIndex extends Job
{
    public string $name;

    public function run(): void
    {
        $indexExist = false;

        foreach ($this->getSpaceInstances() as $space) {
            if ($space === null) {
                continue;
            }

            foreach ($space->mapper->find('_vindex', ['id' => $space->getId()]) as $index) {
                if ($index['name'] == $this->name) {
                    $space->mapper->client->call("box.space." . $space->getName() . ".index.$this->name:drop");
                    $indexExist = true;
                }
            }
        }

        if (!$indexExist) {
            throw new Exception("Index $this->name not found");
        }
    }
}
