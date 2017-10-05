<?php

namespace Job\Space;

use Exception;

class Info extends Job
{
    public function run()
    {
        $space = $this->getSpace();

        $format = $space->getFormat();
        $indexes = $space->getIndexes();
        $fake = !count($format);

        if ($fake) {
            $spaceName = $space->getName();
            $format = [];
            $count = $this->getClient()->evaluate("return box.space.$spaceName.field_count")->getData()[0];
            $count = $count ?: 20; // default max columns
            foreach (range(1, $count) as $value) {
                $format[] = [
                    'name' => "".$value,
                    'type' => 'str',
                ];
            }
        }

        foreach ($indexes as $i => $index) {
            $spaceName = $space->getName();
            $id = $index['iid'];
            try {
                $indexes[$i]['size'] = $this->getClient()->evaluate("return box.space.$spaceName.index[$id]:bsize()")->getData()[0];
            } catch (Exception $e) {
                // no bsize
                break;
            }
        }

        return compact('format', 'indexes', 'fake');
    }
}
