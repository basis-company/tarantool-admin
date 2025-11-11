<?php

namespace Job\Database;

use Exception;
use Tarantool\Client\Response;
use Tarantool\Client\Keys;

class Sql extends Job
{
    public string $query;

    private const DEFAULT_LIMIT = 500;
    private const LIMITER_WRAPPER = "SELECT * FROM (%s) LIMIT %d";
    private const UPDATE_EXPR_REGEXP = "/\b(drop|truncate|create|insert|delete|update|merge)\b/i";

    public function run(): array
    {
        if (!getenv("TARANTOOL_SQL_QUERY")) {
            throw new Exception("SQL code execution is forbidden");
        }

        $tarantoolReadonly =
            getenv("TARANTOOL_READONLY") === "true" ||
            getenv("TARANTOOL_READONLY") === "1";

        $query = $this->query;
        $query = $this->stripSqlCommentsRegex($query);

        $isReadQuery = $this->isQueryReadonly($query);

        if (!$isReadQuery && $tarantoolReadonly) {
            throw new Exception("Tarantool admin is in readonly mode");
        }

        $rowsLimit = Sql::DEFAULT_LIMIT;
        if (
            ($rowsLimitStr = trim(getenv("TARANTOOL_SQL_LIMIT"))) &&
            is_numeric($rowsLimitStr)
        ) {
            $rowsLimit = (int) $rowsLimitStr;
        }

        if ($isReadQuery && $rowsLimit > 0) {
            $query = rtrim($query, ";\r\n\t ");
            $query = sprintf(
                $this::LIMITER_WRAPPER,
                $query,
                $rowsLimit,
            );
        }

        $start = microtime(true);
        $mapper = $this->getMapper();

        try {
            $response = $mapper->client->execute($query);
        } catch (\Throwable $e) {
            return [
                "error" => $e->getMessage(),
                "data" => [],
                "total" => null,
                "next" => false,
                "timing" => 1000 * (microtime(true) - $start),
            ];
        }

        [$message, $columns, $rows] = $this->parseExecuteResponse($response);

        return [
            "columns" => $columns,
            "message" => $message,
            "data" => $rows,
            "total" => count($rows),
            "timing" => 1000 * (microtime(true) - $start),
            "limited" => $rowsLimit > 0 ? count($rows) == $rowsLimit : false,
            "executed_sql" => $query,
        ];
    }

    /**
     * Returns true if query is read only
     * @param string $query
     * @return bool
     */
    private function isQueryReadonly($query): bool
    {
        return !preg_match($this::UPDATE_EXPR_REGEXP, $query);
    }

    /**
     * Parses box.execute response and returns it as an array of columns and tuples.
     * @param Response|null $response
     * @return array
     */
    private function parseExecuteResponse($response): array
    {
        $msg = "";
        $columns = [];
        $rows = [];

        $response_columns = $response->tryGetBodyField(Keys::METADATA, []);

        foreach ($response_columns as $column_pair) {
            if (is_array($column_pair)) {
                array_push($columns, $column_pair[Keys::METADATA_FIELD_NAME]);
            }
        }

        $rows = $response->tryGetBodyField(Keys::DATA, []);

        if ($sql_info = $response->tryGetBodyField(Keys::SQL_INFO)) {
            $msg = sprintf(
                "%d rows affected",
                $sql_info[Keys::SQL_INFO_ROW_COUNT],
            );
        }

        return [$msg, $columns, $rows];
    }

    private function stripSqlCommentsRegex($sql): string
    {
        // remove block comments not inside quotes
        $sql = preg_replace(
            '/(?s)(\'(?:\\\\.|[^\\\\\'])*\'|"(?:\\\\.|[^\\\\"])*")(*SKIP)(*F)|\/\*.*?\*\//',
            "",
            $sql,
        );

        // remove -- line comments not inside quotes
        $sql = preg_replace(
            '/(?m)(\'(?:\\\\.|[^\\\\\'])*\'|"(?:\\\\.|[^\\\\"])*")(*SKIP)(*F)|--.*$/',
            "",
            $sql,
        );

        // remove # line comments (MySQL) not inside quotes
        $sql = preg_replace(
            '/(?m)(\'(?:\\\\.|[^\\\\\'])*\'|"(?:\\\\.|[^\\\\"])*")(*SKIP)(*F)|#.*$/',
            "",
            $sql,
        );

        // normalize whitespace
        $sql = preg_replace("/\s+/", " ", $sql);

        return trim($sql);
    }
}
