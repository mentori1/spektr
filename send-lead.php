<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'bad_json'], JSON_UNESCAPED_UNICODE);
    exit;
}

$honeypot = trim((string)($data['website'] ?? ''));
if ($honeypot !== '') {
    echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

$clean = static function ($value, int $limit = 1000): string {
    $value = trim((string)$value);
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    if (function_exists('mb_substr')) return mb_substr($value, 0, $limit, 'UTF-8');
    return substr($value, 0, $limit);
};

$name = $clean($data['name'] ?? '', 120);
$phone = $clean($data['phone'] ?? '', 80);
$message = $clean($data['message'] ?? '', 2000);
$source = $clean($data['source'] ?? 'Форма сайта', 180);
$page = $clean($data['page'] ?? '', 300);
$kind = $clean($data['kind'] ?? 'lead', 40);
$messenger = $clean($data['messenger'] ?? '', 80);
$contact = $clean($data['contact'] ?? $phone, 160);
$total = $clean($data['total'] ?? '', 80);

if ($kind === 'cart') {
    if ($contact === '') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'required_contact'], JSON_UNESCAPED_UNICODE);
        exit;
    }
} else {
    if ($name === '' || $phone === '') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'required_fields'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $digits = preg_replace('/\D+/', '', $phone) ?? '';
    if (strlen($digits) < 10) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'bad_phone'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$ua = $clean($_SERVER['HTTP_USER_AGENT'] ?? '', 300);
$time = date('d.m.Y H:i:s');

$subject = $kind === 'cart' ? 'Новая заявка из корзины Спектр Металла' : 'Новая заявка с сайта Спектр Металла';
if ($kind === 'cart') {
    $body = "Новая заявка из корзины spectr-metalla.ru\n\n" .
            "Источник: {$source}\n" .
            "Имя: " . ($name !== '' ? $name : 'Не указано') . "\n" .
            "Удобный способ связи: " . ($messenger !== '' ? $messenger : 'Не указан') . "\n" .
            "Контакт клиента: {$contact}\n" .
            ($total !== '' ? "Итого ориентировочно: {$total} ₽\n" : "") .
            ($page !== '' ? "Страница: {$page}\n" : "") .
            "Дата: {$time}\n" .
            "IP: {$ip}\n" .
            "User-Agent: {$ua}\n\n" .
            ($message !== '' ? $message . "\n" : '');
} else {
    $body = "Новая заявка с сайта spectr-metalla.ru\n\n" .
            "Источник: {$source}\n" .
            "Имя: {$name}\n" .
            "Телефон: {$phone}\n" .
            ($message !== '' ? "Что считаем: {$message}\n" : "") .
            ($page !== '' ? "Страница: {$page}\n" : "") .
            "Дата: {$time}\n" .
            "IP: {$ip}\n" .
            "User-Agent: {$ua}\n";
}

$to = 'spektrmetalla@mail.ru';
$from = 'noreply@spectr-metalla.ru';
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: Спектр Металла <' . $from . '>',
    'Reply-To: ' . $to,
];

$sent = mail($to, $encodedSubject, $body, implode("\r\n", $headers), '-f ' . $from);
if (!$sent) {
    error_log('Lead mail failed: ' . $body);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'mail_failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
