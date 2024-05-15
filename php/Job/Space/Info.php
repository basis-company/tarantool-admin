<?php

namespace Job\Space;

use Exception;

class Info extends Job
{
    public function run(): array
    {
        $space = $this->getSpace();
        $format = $this->getFormat();
        $indexes = $this->getMapper()->find('_vindex', [
            'id' => $space->getId(),
        ]);
        $fake = !count($format);
        $spaceName = $space->getName();

        if ($fake) {
            $format = [];
            $count = $this->getClient()->evaluate("return box.space['$spaceName'].field_count")[0];
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
                $indexes[$i]['id'] = $index['iid'];
                $indexName = $index['name'];
                $indexes[$i]['size'] = $this->getClient()->call("box.space.$spaceName.index.$indexName:bsize")[0];
            } catch (Exception) {
                // no bsize
                break;
            }
        }

        return compact('format', 'indexes', 'fake');
    }
}
