<?php

namespace Job\Space;

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

        return compact('format', 'indexes', 'fake');
    }
}
