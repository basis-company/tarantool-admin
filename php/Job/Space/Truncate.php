<?php

namespace Job\Space;

use Exception;

class Truncate extends Job
{
    public array $key = [];
    public ?int $indexNumber = null;
    public int $iterator = 0;

    public function run(): void
    {
        $space = $this->getSpace();

        if ($space->getId() < 512) {
            throw new Exception('Disabled for system spaces');
        }

        if (!$this->key || $this->indexNumber == null) {
            $this->getClient()->call('box.space.' . $space->getName() . ':truncate');
        } else {
            $spaceName = $space->getName();
            $this->getClient()->evaluate('tuples = box.space.' . $spaceName . '.index[' . $this->indexNumber . ']:
                                        select({' . implode(',', $this->preparedKey($this->key)) . '},
                                                {iterator=' . $this->iterator . '}) 
                                        local key = {}
                                        for i = 1, #tuples, 1 do
                                            tuple = tuples[i]            
                                            key = {}
                                            for _, part in pairs(box.space.' . $space->getName() . '.index[0].parts) do
                                                table.insert(key, tuple[part.fieldno])
                                            end
                                            box.space.' . $space->getName() . ':delete(key)
                                        end');
        }
    }

    private function preparedKey($key): array
    {
        $editedKey = [];
        foreach ($key as $part) {
            if (is_string($part)) {
                $editedPart = "'" . $part . "'";
            } else {
                $editedPart = $part;
            }
            if ($editedPart != null) {
                $editedKey[] = $editedPart;
            }
        }
        return $editedKey;
    }
}
