<?php

namespace Job\Entity;

use Job\Space\Job;
use Basis\Converter;
use Exception;
use stdClass;
use Symfony\Component\Uid\Uuid;
use Tarantool\Client\Schema\Operations;

class Update extends Job
{
    public stdClass $values;

    public function run(Converter $converter): void
    {
        $pk = [];
        $space = $this->getSpace();

        if (!count($space->getFormat())) {
            $data = [];
            foreach ($this->values as $k => $v) {
                if (!is_numeric($k)) {
                    throw new Exception("Named property $k without format definition");
                }
                $data[$k - 1] = $v;
            }

            $pk = [];
            foreach ($space->getIndexes()[0]['parts'] as $part) {
                $value = $data[$part[0]];
                unset($data[$part[0]]);
                if (array_key_exists(1, $part) && $part[1] === 'unsigned') {
                    $value = +$value;
                }
                $pk[] = $value;
            }

            $operations = null;
            foreach ($data as $index => $value) {
                if (!$operations) {
                    $operations = Operations::set($index, $value);
                } else {
                    $operations = $operations->andSet($index, $value);
                }
            }

            $space->getMapper()->getClient()
                ->getSpace($space->getName())
                ->update($pk, $operations);
        } else {
            $format = $space->getFormat();
            foreach ($space->getPrimaryIndex()['parts'] as $part) {
                $fieldName = $format[$part[0]]['name'];
                $pk[$fieldName] = $this->values->$fieldName;
            }

            $entity = $space->getRepository()->findOrFail($pk);
            foreach ($this->values as $k => $v) {
                $type = $space->getProperty($k)['type'];
                if ($type === 'uuid') {
                    $v = new Uuid($v);
                } elseif ($type == 'map') {
                    if ($v !== null) {
                        if (is_string($v)) {
                            $v = json_decode($v);
                        }
                        if (!is_array($v) && !is_object($v)) {
                            $extra = '';
                            if (is_string($this->values->$k)) {
                                $extra .= ': ' . $this->values->$k;
                            }
                            throw new Exception("Invalid type for '$k' ($type)$extra");
                        }
                        $v = $converter->toArray($v);
                        if (!count($v)) {
                            $v = null;
                        }
                    }
                }
                $entity->$k = $v;
            }
            $this->getMapper()->save($entity);
        }
    }
}
