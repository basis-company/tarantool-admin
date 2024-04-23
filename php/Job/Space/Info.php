<?php

namespace Job\Space;

use Exception;

class Info extends Job
{
    public function run(): array
    {
        $space = $this->getSpace();
        $format = array_values($space->getProperties());
        $indexes = $this->getSpaceIndexes();
        $fake = !count($format);

        if ($fake) {
            $format = [];
            $count = $this->getClient()->evaluate("return box.space['$space->name'].field_count")[0];
            $count = $count ?: 20; // default max columns
            foreach (range(1, $count) as $value) {
                $format[] = [
                    'name' => "" . $value,
                    'type' => 'str',
                ];
            }
        }

        foreach ($indexes as $i => $index) {
            try {
                $indexes[$i]->iid = $index->id;
                $indexes[$i]->size = $this->getClient()->call("box.space.$space->name.index.$index->name:bsize")[0];
            } catch (Exception) {
                // no bsize
                break;
            }
        }

        return compact('format', 'indexes', 'fake');
    }
}
