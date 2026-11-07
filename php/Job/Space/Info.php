<?php

namespace Job\Space;

use Exception;

class Info extends Job
{
    public function run(): array
    {
        if ($this->isCluster()) {
            return $this->runCluster();
        }

        $space = $this->getSpace();
        $format = $this->getFormat();
        $indexes = $this->getMapper()->find('_vindex', [
            'id' => $space->getId(),
        ]);
        $fake = !count($format);

        if ($fake) {
            $format = [];
            $count = $this->getClient()->evaluate("return box.space['" . $space->getName() . "'].field_count")[0];
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
                $indexes[$i]['size'] = $this->getClient()->call(
                    "box.space." . $space->getName() . ".index." . $index['name'] . ":bsize"
                )[0];
            } catch (Exception) {
                // no bsize
                break;
            }
        }

        return compact('format', 'indexes', 'fake');
    }

    /**
     * Space metadata is taken from the first host that has the space.
     * Indexes are reported by name; ids differ between cluster nodes.
     */
    protected function runCluster(): array
    {
        $format = [];
        $indexes = [];
        $client = null;

        foreach ($this->getSpaceInstances() as $space) {
            if ($space === null) {
                continue;
            }

            $format = $this->formatOf($space);
            $indexes = $space->mapper->find('_vindex', ['id' => $space->getId()]);
            $client = $space->mapper->client;

            if (count($format)) {
                break;
            }
        }

        if ($client === null) {
            throw new Exception("Space $this->space does not exist in the cluster");
        }

        $fake = !count($format);

        if ($fake) {
            $format = [];
            $count = $client->evaluate("return box.space['" . $this->space . "'].field_count")[0];
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
                $indexes[$i]['size'] = $client->call(
                    "box.space." . $this->space . ".index." . $index['name'] . ":bsize"
                )[0];
            } catch (Exception) {
                // no bsize
                break;
            }
        }

        return compact('format', 'indexes', 'fake');
    }
}
