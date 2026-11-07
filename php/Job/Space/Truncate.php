<?php

namespace Job\Space;

use Exception;

class Truncate extends Job
{
    public array $key = [];

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

            if (count($this->key) == 0) {
                $instance->mapper->client->call('box.space.' . $instance->getName() . ':truncate');
            } else {
                $instance->mapper->client->evaluate(
                    'local space, index, key, iterator = ...
                    box.begin()
                    box.space[space].index[index]:pairs(key, {iterator=iterator})
                        :each(function(tuple)
                            local pk = {}
                            for _, part in pairs(box.space[space].index[0].parts) do
                                table.insert(pk, tuple[part.fieldno])
                            end
                            box.space[space]:delete(pk)
                        end)
                    box.commit()',
                    $instance->getName(),
                    $this->indexNameOf($instance, $this->index) ?: $this->index,
                    $this->trimTail($this->key),
                    $this->iterator
                );
            }
        }
    }
}
