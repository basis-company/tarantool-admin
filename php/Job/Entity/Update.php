<?php

namespace Job\Entity;

use Job\Space\Job;
use Exception;
use stdClass;
use Symfony\Component\Uid\Uuid;
use Tarantool\Client\Schema\Operations;

class Update extends Job
{
    public stdClass $values;
    public Converter $converter;

    public function run(): void
    {
        $pk = [];
        $space = $this->getSpace();

        if (!count($space->getProperties())) {
            $data = [];
            foreach ($this->values as $k => $v) {
                if (!is_numeric($k)) {
                    throw new Exception("Named property $k without format definition");
                }
                $data[$k - 1] = $v;
            }

            $pk = [];
            foreach ($space->getIndexes()[0]['parts'] as $part) {
                $value = $data[array_key_exists(0, $part) ? $part[0] : $part['field']];
                unset($data[array_key_exists(0, $part) ? $part[0] : $part['field']]);
                if ((array_key_exists(1, $part) ? $part[1] : $part['type']) === 'unsigned') {
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
            $format = array_values($space->getProperties());
            foreach ($space->getIndex(0)->parts as $part) {
                $fieldName = $format[array_key_exists(0, $part) ? $part[0] : $part['field']]->name;
                $pk[$fieldName] = $this->values->$fieldName;
            }

            $entity = $space->getRepository()->findOrFail($pk);
            foreach ($this->values as $k => $v) {
                $type = $space->getProperty($k)->type;
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
                        $v = $this->converter->toArray($v);
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
