<?php

namespace Job\Space;

use Exception;

class Drop extends Job
{
    public function run(): void
    {
        $instances = $this->getSpaceInstances();

        $space = reset($instances);
        if ($space && $space->getId() < 512) {
            throw new Exception('Disabled for system spaces');
        }

        foreach ($instances as $instance) {
            if ($instance === null) {
                continue;
            }

            $instance->mapper->client->call('box.space.' . $instance->getName() . ':drop');
        }
    }
}
