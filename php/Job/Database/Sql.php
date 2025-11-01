<?php

namespace Job\Database;

use Exception;
use Tarantool\Client\Response;
use Tarantool\Client\Keys;

class Sql extends Job
{
    public string $sql_expression;

    private const DEFAULT_LIMIT = 500;
    private const LIMITER_WRAPPER = "SELECT * FROM (%s) LIMIT %d";
    private const UPDATE_EXPR_REGEXP = "/\b(drop|truncate|create|insert|delete|update|merge)\b/i";

    public function run(): array
    {
        if (!getenv("TARANTOOL_SQL_QUERY")) {
            throw new Exception("SQL code execution is forbidden");
        }

        $tarantool_readonly =
            getenv("TARANTOOL_READONLY") === "true" ||
            getenv("TARANTOOL_READONLY") === "1";

        $sql_expression = $this->sql_expression;
        $sql_expression = $this->strip_sql_comments_regex($sql_expression);

        $is_read_query = $this->is_query_readonly($sql_expression);

        if (!$is_read_query && $tarantool_readonly) {
            throw new Exception("Tarantool admin is in readonly mode");
        }

        $rows_limit = Sql::DEFAULT_LIMIT;
        if (
            ($rows_limit_str = trim(getenv("TARANTOOL_SQL_LIMIT"))) &&
            is_numeric($rows_limit_str)
        ) {
            $rows_limit = (int) $rows_limit_str;
        }

        if ($is_read_query && $rows_limit > 0) {
            $sql_expression = rtrim($sql_expression, ";\r\n\t ");
            $sql_expression = sprintf(
                $this::LIMITER_WRAPPER,
                $sql_expression,
                $rows_limit,
            );
        }

        $start = microtime(true);
        $mapper = $this->getMapper();

        try {
            $response = $mapper->client->execute($sql_expression);
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
            "limited" => $rows_limit > 0 ? count($rows) == $rows_limit : false,
            "executed_sql" => $sql_expression,
        ];
    }

    /**
     * Returns true if sql_expression is read only
     * @param string $sql_expression
     * @return bool
     */
    private function is_query_readonly($sql_expression): bool
    {
        return !preg_match($this::UPDATE_EXPR_REGEXP, $sql_expression);
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

    private function strip_sql_comments_regex($sql): string
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
