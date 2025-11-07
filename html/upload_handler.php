<?php
// upload_handler.php
// Simple handler: save uploaded file, send email with attachment using mail().
// NOTE: your server must have PHP mail() configured to actually send email.
// Put this file in the same folder as create.html (or adapt the form action).

header('Content-Type: application/json');

// configure max file size (bytes)
$MAX_SIZE = 8 * 1024 * 1024; // 8 MB

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method.');
    }

    // required fields
    $recipient = filter_var($_POST['recipient'] ?? '', FILTER_VALIDATE_EMAIL);
    $subject = substr(trim($_POST['subject'] ?? 'OVA Submission'), 0, 200);
    $studentName = trim($_POST['studentName'] ?? '');
    $studentEmail = filter_var($_POST['studentEmail'] ?? '', FILTER_VALIDATE_EMAIL);
    $studentText = trim($_POST['studentText'] ?? '');

    if (!$recipient) {
        throw new Exception('Recipient email not configured on the form.');
    }
    if (!$studentName || !$studentText) {
        throw new Exception('Missing name or text.');
    }

    // handle file
    if (!isset($_FILES['audioFile']) || $_FILES['audioFile']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Audio file upload error.');
    }

    $f = $_FILES['audioFile'];
    if ($f['size'] > $MAX_SIZE) {
        throw new Exception('File too large. Max 8MB allowed.');
    }

    $tmpPath = $f['tmp_name'];
    $filename = basename($f['name']);
    $mimeType = mime_content_type($tmpPath);

    // read file content for attachment
    $fileData = file_get_contents($tmpPath);
    if ($fileData === false) {
        throw new Exception('Could not read uploaded file.');
    }

    // prepare email headers and body (MIME multipart)
    $boundary = "===PHP-MAIL-".md5(time())."===";
    $from = ($studentEmail) ? $studentEmail : 'no-reply@' . $_SERVER['SERVER_NAME'];
    $headers = "From: " . $studentName . " <" . $from . ">\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n";

    $body = "--{$boundary}\r\n";
    $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";

    $body .= "OVA Submission — Create module\r\n";
    $body .= "Student name: {$studentName}\r\n";
    if ($studentEmail) $body .= "Student email: {$studentEmail}\r\n";
    $body .= "\r\n--- Student text ---\r\n";
    $body .= "{$studentText}\r\n\r\n";

    // attach file (base64)
    $body .= "--{$boundary}\r\n";
    $body .= "Content-Type: {$mimeType}; name=\"{$filename}\"\r\n";
    $body .= "Content-Transfer-Encoding: base64\r\n";
    $body .= "Content-Disposition: attachment; filename=\"{$filename}\"\r\n\r\n";
    $body .= chunk_split(base64_encode($fileData)) . "\r\n";
    $body .= "--{$boundary}--\r\n";

    // send
    $ok = mail($recipient, $subject, $body, $headers);

    if ($ok) {
        echo json_encode(['success' => true]);
    } else {
        throw new Exception('mail() returned false. Server may not support mail() or configuration required.');
    }

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
