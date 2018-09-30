<?php

// Import PHPMailer classes into the global namespace
// These must be at the top of your script, not inside a function
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

//Load Composer's autoloader
require 'vendor/autoload.php';

$mail = new PHPMailer(true);                              // Passing `true` enables exceptions
try {
    //Server settings
    //$mail->SMTPDebug = 1;                                 // Enable verbose debug output
    $mail->isSMTP();                                      // Set mailer to use SMTP
    $mail->Host = 'smtp.gmail.com';  // Specify main and backup SMTP servers
    $mail->SMTPAuth = true;                               // Enable SMTP authentication
    $mail->Username = 'testing.task2017@gmail.com';                 // SMTP username
    $mail->Password = 'passguess';                           // SMTP password
    $mail->SMTPSecure = 'tls';                            // Enable TLS encryption, `ssl` also accepted
    $mail->Port = 587;                                    // TCP port to connect to

    //Recipients
    $mail->setFrom('testing.task2017@gmail.com', 'Tester');
    $mail->addAddress($_POST['email']);     // Add a recipient       

    $base = explode('data:application/pdf;base64,', $_POST['pdf']);
    $base = base64_decode($base[1]);
    $mail->addStringAttachment($base, 'order.pdf');

    //Content
    $body = 'This is the order made by you. <strong>Thanks</strong> for choosing our company';
    $mail->isHTML(true);                                  // Set email format to HTML
    $mail->Subject = 'Order sheet';
    $mail->Body    = $body;
    $mail->AltBody = strip_tags($body);

    $mail->send();
    echo json_encode('Success');
    die();
    
} catch (Exception $e) {
    echo json_encode('Error'); 
    die();   
}

?>