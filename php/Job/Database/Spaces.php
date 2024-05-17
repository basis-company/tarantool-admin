<?php

namespace Job\Database;

use Exception;

class Spaces extends Job
{
    public function run(): array
    {
        $mapper = $this->getMapper();

        $spaces = [];
        foreach ($mapper->find('_vspace') as $space) {
            try {
                if ($space['engine'] !== 'vinyl') {
                    $space['count'] = $mapper->client->call("box.space." . $space['name'] . ":count")[0];
                }
                $space['bsize'] = $mapper->client->call("box.space." . $space['name'] . ":bsize")[0];
            } catch (Exception) {
            }
            $spaces[] = $space;
        }

        return compact('spaces');
    }
}
