<?php

namespace Job\Space;

use Exception;

class Truncate extends Job
{
    public array $key = [];

    public function run(): void
    {
        $space = $this->getSpace();

        if ($space->getId() < 512) {
            throw new Exception('Disabled for system spaces');
        }

        if (count($this->key) == 0) {
            $this->getClient()->call('box.space.' . $space->getName() . ':truncate');
        } else {
            $this->getClient()->evaluate(
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
                $space->getName(),
                $this->index,
                $this->trimTail($this->key),
                $this->iterator
            );
        }
    }
}
