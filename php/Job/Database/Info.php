<?php

namespace Job\Database;

use Exception;

class Info extends Job
{
    public function run(): array
    {
        if ($this->isCluster()) {
            return $this->runCluster();
        }

        $client = $this->getMapper()->client;

        $stats = [
            'info' => 'box.info',
            'stat' => 'box.stat',
            'slab' => 'box.slab.info',
        ];

        $info = [];
        foreach ($stats as $k => $function) {
            try {
                $info[$k] = $client->call($function)[0];
            } catch (Exception) {
            }
        }

        return $info;
    }

    protected function runCluster(): array
    {
        $info = [];
        $stat = [];
        $slab = [];

        foreach ($this->getMappers() as $dsn => $mapper) {
            $client = $mapper->client;
            $label = str_replace(['tcp://', 'unix://'], '', $dsn);

            try {
                $node = $client->call('box.info')[0];
                $info[$label] = implode(', ', array_filter([
                    $node['uuid'] ?? null,
                    $node['version'] ?? null,
                    ($node['uptime'] ?? null) !== null
                        ? round($node['uptime']) . 's up'
                        : null,
                ]));
            } catch (Exception $e) {
                $info[$label] = 'unreachable: ' . $e->getMessage();
            }

            try {
                foreach ($client->call('box.stat')[0] as $action => $counters) {
                    if (!is_array($counters)) {
                        continue;
                    }

                    foreach ($counters as $k => $v) {
                        if (is_numeric($v)) {
                            $stat[$action][$k] = ($stat[$action][$k] ?? 0) + $v;
                        }
                    }
                }
            } catch (Exception) {
            }

            try {
                foreach ($client->call('box.slab.info')[0] as $k => $v) {
                    if (is_numeric($v)) {
                        $slab[$k] = ($slab[$k] ?? 0) + $v;
                    } elseif (!array_key_exists($k, $slab)) {
                        $slab[$k] = $v;
                    }
                }
            } catch (Exception) {
            }
        }

        return compact('info', 'stat', 'slab');
    }
}
