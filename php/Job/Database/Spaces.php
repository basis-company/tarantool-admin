<?php

namespace Job\Database;

use Exception;

class Spaces extends Job
{
    public function run(): array
    {
        if ($this->isCluster()) {
            return $this->runCluster();
        }

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

    protected function runCluster(): array
    {
        $merged = [];

        foreach ($this->getMappers() as $mapper) {
            try {
                $rows = $mapper->find('_vspace');
            } catch (Exception) {
                continue;
            }

            foreach ($rows as $space) {
                $name = $space['name'];

                if (!array_key_exists($name, $merged)) {
                    if (($space['id'] ?? 0) >= 512) {
                        $space['count'] = 0;
                        $space['bsize'] = 0;
                    }

                    $merged[$name] = $space;
                }

                if (($space['id'] ?? 0) < 512) {
                    continue;
                }

                if ($space['engine'] !== 'vinyl') {
                    try {
                        $merged[$name]['count'] +=
                            $mapper->client->call("box.space." . $name . ":count")[0];
                    } catch (Exception) {
                    }
                }

                try {
                    $merged[$name]['bsize'] +=
                        $mapper->client->call("box.space." . $name . ":bsize")[0];
                } catch (Exception) {
                }
            }
        }

        return ['spaces' => array_values($merged)];
    }
}
