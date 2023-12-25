<?php

namespace Job\Space;

use Exception;

class Truncate extends Job
{
    public array $key = [];
    public ?int $index = null;

    public function run(): void
    {
        $space = $this->getSpace();
        $key = $this->trimTail($this->key);

        if ($space->getId() < 512) {
            throw new Exception('Disabled for system spaces');
        }

        if (count($this->key) == 0 || $this->index == null) {
            $this->getClient()->call('box.space.' . $space->getName() . ':truncate');
        } else {
            $this->getClient()->evaluate(
                'local space, index, key, iterator = ...
                box.begin()
                box.space[space].index[index]:pairs(key, {iterator=iterator})
                    :each(function(tuple)
                        local key = {}
                        for _, part in pairs(box.space[space].index[0].parts) do
                            table.insert(key, tuple[part.fieldno])
                        end
                        box.space[space]:delete(key)
                    end)
                box.commit()',
                $space->getName(),
                $this->index,
                $key,
                $this->iterator
            );
        }
    }
}
