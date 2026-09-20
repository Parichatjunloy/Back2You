-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 20, 2026 at 10:04 AM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `back2you`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `action`, `description`, `ip_address`, `created_at`) VALUES
(1, 4, 'lost_item_approved', 'อนุมัติประกาศของหาย “แมวนักกิน” #3', NULL, '2026-09-20 03:08:51'),
(2, 4, 'found_item_approved', 'อนุมัติประกาศของพบ “แมวสีขาวดำ” #4', NULL, '2026-09-20 03:20:56'),
(3, 4, 'item_match_confirmed', 'ยืนยันคู่ของหาย #2 กับของพบ #4', NULL, '2026-09-20 03:33:32'),
(4, 4, 'lost_item_approved', 'อนุมัติประกาศของหาย “แมวเป้า” #4', NULL, '2026-09-20 03:40:10'),
(5, 4, 'item_match_confirmed', 'ยืนยันคู่ของหาย #4 กับของพบ #3', NULL, '2026-09-20 03:40:19'),
(6, 4, 'claim_approved', 'อนุมัติคำขอรับของคืน #2', NULL, '2026-09-20 03:42:20'),
(7, 4, 'return_scheduled', 'สร้างนัดคืนของ #2 สำหรับ Claim #2 ที่ บ้านกุ๊กๆ', NULL, '2026-09-20 03:45:13'),
(8, 4, 'item_match_rejected', 'ปฏิเสธคู่ของหาย #1 กับของพบ #4', NULL, '2026-09-20 03:49:52'),
(9, 4, 'item_match_rejected', 'ปฏิเสธคู่ของหาย #4 กับของพบ #2', NULL, '2026-09-20 03:49:59'),
(10, 1, 'admin_category_created', 'Admin เพิ่มหมวดหมู่ \"สัตว์เลี้ยง\"', NULL, '2026-09-20 05:28:27'),
(11, 1, 'admin_category_deleted', 'Admin ลบหมวดหมู่ \"สัตว์เลี้ยง\"', NULL, '2026-09-20 05:29:13'),
(12, 1, 'admin_complaint_status_updated', 'Admin เปลี่ยนสถานะการร้องเรียน \"สีจืดเกินไป\" จาก pending เป็น resolved', NULL, '2026-09-20 06:18:51'),
(13, 4, 'found_item_approved', 'อนุมัติประกาศของพบ “สุนัข” #5', NULL, '2026-09-20 07:39:11'),
(14, 4, 'lost_item_approved', 'อนุมัติประกาศของหาย “หมาเซา” #5', NULL, '2026-09-20 07:43:14'),
(15, 4, 'item_match_confirmed', 'ยืนยันคู่ของหาย #5 กับของพบ #5', NULL, '2026-09-20 07:43:37'),
(16, 4, 'claim_approved', 'อนุมัติคำขอรับของคืน #3', NULL, '2026-09-20 07:45:25'),
(17, 4, 'return_scheduled', 'สร้างนัดคืนของ #3 สำหรับ Claim #3 ที่ มาลา', NULL, '2026-09-20 07:45:54');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'กระเป๋า', 'กระเป๋าทุกประเภท', '2026-09-14 12:06:50'),
(2, 'โทรศัพท์', 'โทรศัพท์มือถือและอุปกรณ์', '2026-09-14 12:06:50'),
(3, 'คอมพิวเตอร์', 'โน้ตบุ๊ก แท็บเล็ต และอุปกรณ์คอมพิวเตอร์', '2026-09-14 12:06:50'),
(4, 'กุญแจ', 'กุญแจบ้าน กุญแจรถ และกุญแจอื่น ๆ', '2026-09-14 12:06:50'),
(5, 'บัตร', 'บัตรประชาชน บัตรนักเรียน บัตรพนักงาน และบัตรอื่น ๆ', '2026-09-14 12:06:50'),
(6, 'เอกสาร', 'เอกสาร หนังสือ และสมุด', '2026-09-14 12:06:50'),
(7, 'เครื่องประดับ', 'แหวน สร้อย นาฬิกา และเครื่องประดับ', '2026-09-14 12:06:50'),
(8, 'เสื้อผ้า', 'เสื้อ กางเกง รองเท้า และเครื่องแต่งกาย', '2026-09-14 12:06:50'),
(9, 'อุปกรณ์การเรียน', 'ปากกา ดินสอ หนังสือ และอุปกรณ์การเรียน', '2026-09-14 12:06:50'),
(10, 'อื่น ๆ', 'สิ่งของประเภทอื่น ๆ', '2026-09-14 12:06:50');

-- --------------------------------------------------------

--
-- Table structure for table `claims`
--

CREATE TABLE `claims` (
  `id` int(11) NOT NULL,
  `found_item_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `staff_note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `claims`
--

INSERT INTO `claims` (`id`, `found_item_id`, `user_id`, `message`, `status`, `reviewed_by`, `reviewed_at`, `staff_note`, `created_at`, `updated_at`) VALUES
(1, 1, 6, 'มีหนวดสีดำ 1 เส้น มีปลอกคอสีแดง ตัวหนักมาก', 'approved', 4, '2026-09-19 22:37:39', NULL, '2026-09-19 15:28:57', '2026-09-19 15:37:39'),
(2, 3, 2, 'อารมณ์ไบโพลา มีปลอกคอลูกปัด', 'approved', 4, '2026-09-20 10:42:20', NULL, '2026-09-20 03:41:35', '2026-09-20 03:42:20'),
(3, 5, 2, 'หมาไซบีเรีย เพศชาย ชื่อโคล่า', 'approved', 4, '2026-09-20 14:45:25', NULL, '2026-09-20 07:44:54', '2026-09-20 07:45:25');

-- --------------------------------------------------------

--
-- Table structure for table `complaints`
--

CREATE TABLE `complaints` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subject` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `related_lost_item_id` int(11) DEFAULT NULL,
  `related_found_item_id` int(11) DEFAULT NULL,
  `status` enum('pending','investigating','resolved','rejected') DEFAULT 'pending',
  `handled_by` int(11) DEFAULT NULL,
  `staff_note` text DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `complaints`
--

INSERT INTO `complaints` (`id`, `user_id`, `subject`, `description`, `related_lost_item_id`, `related_found_item_id`, `status`, `handled_by`, `staff_note`, `resolved_at`, `created_at`) VALUES
(1, 6, 'สีจืดเกินไป', 'ช่วยตกแต่งให้ระบบดูมีสีสันให้หน่อย', NULL, NULL, 'resolved', 1, NULL, '2026-09-20 13:18:51', '2026-09-20 06:18:12');

-- --------------------------------------------------------

--
-- Table structure for table `found_items`
--

CREATE TABLE `found_items` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `contact` varchar(255) DEFAULT NULL,
  `location` varchar(255) NOT NULL,
  `found_date` date NOT NULL,
  `found_time` time DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','claimed','returned') DEFAULT 'pending',
  `staff_note` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `found_items`
--

INSERT INTO `found_items` (`id`, `user_id`, `category_id`, `title`, `description`, `contact`, `location`, `found_date`, `found_time`, `image`, `status`, `staff_note`, `approved_by`, `approved_at`, `created_at`, `updated_at`) VALUES
(1, 4, 10, 'แมวนักเลง', 'แมวสีส้ม หน้าตานักเลงแบ๋ว หนัก7โล', '0834910946', 'บ้านแฮปปี้', '2026-09-01', NULL, '/image/1789826023759-a979a9759f3b.jpeg', 'returned', NULL, 4, '2026-09-19 21:11:31', '2026-09-19 13:53:43', '2026-09-19 16:01:02'),
(2, 6, 10, 'สุนัขนั่งเส้า', 'สุนัขสีขาว เรียบร้อย ขี้กลัว', '0834910946', 'บ้านกุ๊กๆ', '2026-09-04', NULL, '/image/1789835887868-c3f062a855d5.jpeg', 'approved', NULL, 4, '2026-09-19 23:43:39', '2026-09-19 16:38:07', '2026-09-19 16:43:39'),
(3, 6, 10, 'แมวเป้า', 'แมวลายวัว นิสัยไบโพลา', '0834910946', 'บ้านกุ๊กๆ', '2026-09-03', NULL, '/image/1789836169641-188c78d4c43d.jpeg', 'returned', NULL, 4, '2026-09-19 23:43:25', '2026-09-19 16:42:49', '2026-09-20 03:45:46'),
(4, 2, 10, 'แมวสีขาวดำ', 'แมวสีขาวดำ ขี้เซา', '0959977072', 'บ้านกุ๊กๆ', '2026-09-02', NULL, '/image/1789874431615-e4519b81820e.jpg', 'approved', NULL, 4, '2026-09-20 10:20:56', '2026-09-20 03:20:31', '2026-09-20 03:20:56'),
(5, 6, 10, 'สุนัข', 'สุนัขพันธุ์ไซบีเรีย น้ำลายบูด', '0834910946', 'มาลา', '2026-09-05', NULL, '/image/1789889654537-c0abbb1e0e06ba2cb7f34879.jpg', 'returned', NULL, 4, '2026-09-20 14:39:11', '2026-09-20 07:34:14', '2026-09-20 07:46:22');

-- --------------------------------------------------------

--
-- Table structure for table `found_item_images`
--

CREATE TABLE `found_item_images` (
  `id` int(11) NOT NULL,
  `found_item_id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `found_item_images`
--

INSERT INTO `found_item_images` (`id`, `found_item_id`, `image_path`, `created_at`) VALUES
(1, 1, '/image/1789826023759-a979a9759f3b.jpeg', '2026-09-19 13:53:43'),
(2, 1, '/image/1789826023763-506c87e26b02.jpeg', '2026-09-19 13:53:43'),
(3, 1, '/image/1789826023766-4bfe5d63ae56.jpeg', '2026-09-19 13:53:43'),
(4, 2, '/image/1789835887868-c3f062a855d5.jpeg', '2026-09-19 16:38:07'),
(5, 3, '/image/1789836169641-188c78d4c43d.jpeg', '2026-09-19 16:42:49'),
(6, 4, '/image/1789874431615-e4519b81820e.jpg', '2026-09-20 03:20:31'),
(7, 5, '/image/1789889654537-c0abbb1e0e06ba2cb7f34879.jpg', '2026-09-20 07:34:14');

-- --------------------------------------------------------

--
-- Table structure for table `item_matches`
--

CREATE TABLE `item_matches` (
  `id` int(11) NOT NULL,
  `lost_item_id` int(11) NOT NULL,
  `found_item_id` int(11) NOT NULL,
  `match_score` int(11) DEFAULT NULL,
  `status` enum('confirmed','rejected') NOT NULL,
  `reviewed_by` int(11) NOT NULL,
  `reviewed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `item_matches`
--

INSERT INTO `item_matches` (`id`, `lost_item_id`, `found_item_id`, `match_score`, `status`, `reviewed_by`, `reviewed_at`, `created_at`) VALUES
(1, 2, 4, 64, 'confirmed', 4, '2026-09-20 10:33:32', '2026-09-20 03:33:32'),
(2, 4, 3, 77, 'confirmed', 4, '2026-09-20 10:40:19', '2026-09-20 03:40:19'),
(3, 1, 4, 55, 'rejected', 4, '2026-09-20 10:49:52', '2026-09-20 03:49:52'),
(4, 4, 2, 50, 'rejected', 4, '2026-09-20 10:49:59', '2026-09-20 03:49:59'),
(5, 5, 5, 65, 'confirmed', 4, '2026-09-20 14:43:37', '2026-09-20 07:43:37');

-- --------------------------------------------------------

--
-- Table structure for table `login_tokens`
--

CREATE TABLE `login_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `login_tokens`
--

INSERT INTO `login_tokens` (`id`, `user_id`, `token`, `expires_at`, `used_at`, `created_at`) VALUES
(33, 4, '099cdf5cf49137767ed1af5aeb9a81d4b6641c157d44f4ecba6541da0590f0bc', '2026-09-19 21:28:26', NULL, '2026-09-19 14:13:26'),
(34, 6, '2517e0694639294ef4e667242238c9fdc7b5bbdf13c1c08a8c622b7710808593', '2026-09-19 22:37:08', NULL, '2026-09-19 15:22:08');

-- --------------------------------------------------------

--
-- Table structure for table `lost_items`
--

CREATE TABLE `lost_items` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(255) NOT NULL,
  `lost_date` date NOT NULL,
  `lost_time` time DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','found','returned') DEFAULT 'pending',
  `staff_note` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lost_items`
--

INSERT INTO `lost_items` (`id`, `user_id`, `category_id`, `title`, `description`, `location`, `lost_date`, `lost_time`, `image`, `status`, `staff_note`, `approved_by`, `approved_at`, `created_at`, `updated_at`) VALUES
(1, 4, 10, 'แมวสีขาวสลิด', 'อ้วนๆ\n\nช่องทางติดต่อ: 0834910946', 'บ้าน', '2026-09-01', NULL, '/image/1789815502665-95e75aca35a316ac.jpg', 'approved', NULL, 4, '2026-09-19 19:50:31', '2026-09-19 10:58:22', '2026-09-19 12:50:31'),
(2, 6, 10, 'แมวขาวดำ', 'สีขาวดำ ขี้เซา\n\nช่องทางติดต่อ: 0834910946', 'บ้านกุ๊กๆ', '2026-09-02', NULL, '/image/1789835388671-8c1a89a58395.jpg', 'approved', NULL, 4, '2026-09-19 23:33:29', '2026-09-19 16:29:48', '2026-09-19 16:33:29'),
(3, 6, 10, 'แมวนักกิน', 'สีส้ม ตัวกลมๆ\n\nช่องทางติดต่อ: 0834910946', 'บ้านแฮปปี้', '2026-09-17', '10:10:00', '/image/1789873694490-b4de2af567a2.jpeg', 'approved', NULL, 4, '2026-09-20 10:08:51', '2026-09-20 03:08:14', '2026-09-20 03:08:51'),
(4, 2, 10, 'แมวเป้า', 'สีขาวดำ อารมณ์ขี้วีน\n\nช่องทางติดต่อ: 0959977072', 'บ้านกุ๊กๆ', '2026-09-05', NULL, '/image/1789875586368-1029d0691ae8.jpeg', 'approved', NULL, 4, '2026-09-20 10:40:10', '2026-09-20 03:39:46', '2026-09-20 03:40:10'),
(5, 2, 10, 'หมาเซา', 'สุนัขพันธุ์ไซบีเรีย สีขาวเทา ตัวใหญ่ เพศผู้\n\nช่องทางติดต่อ: 0959977072', 'มาลา', '2026-09-05', NULL, '/image/1789890162589-59b66b898db560d6f5857a37.jpg', 'approved', NULL, 4, '2026-09-20 14:43:14', '2026-09-20 07:42:42', '2026-09-20 07:43:14');

-- --------------------------------------------------------

--
-- Table structure for table `lost_item_images`
--

CREATE TABLE `lost_item_images` (
  `id` int(11) NOT NULL,
  `lost_item_id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lost_item_images`
--

INSERT INTO `lost_item_images` (`id`, `lost_item_id`, `image_path`, `created_at`) VALUES
(1, 1, '/image/1789815502665-95e75aca35a316ac.jpg', '2026-09-19 10:58:22'),
(2, 2, '/image/1789835388671-8c1a89a58395.jpg', '2026-09-19 16:29:48'),
(3, 3, '/image/1789873694490-b4de2af567a2.jpeg', '2026-09-20 03:08:14'),
(4, 4, '/image/1789875586368-1029d0691ae8.jpeg', '2026-09-20 03:39:46'),
(5, 5, '/image/1789890162589-59b66b898db560d6f5857a37.jpg', '2026-09-20 07:42:42');

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `lost_item_id` int(11) DEFAULT NULL,
  `found_item_id` int(11) DEFAULT NULL,
  `claim_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `related_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `related_id`, `is_read`, `created_at`) VALUES
(1, 6, 'ประกาศได้รับการอนุมัติ', 'ประกาศของหาย “แมวขาวดำ” ได้รับการอนุมัติแล้ว', 'lost_item_approved', 2, 1, '2026-09-19 16:33:29'),
(2, 4, 'มีประกาศของพบใหม่', 'มีประกาศของพบ \"แมวเป้า\" รอการตรวจสอบ', 'staff_found_item_pending', 3, 1, '2026-09-19 16:42:49'),
(3, 6, 'ประกาศได้รับการอนุมัติ', 'ประกาศของที่พบ “แมวเป้า” ได้รับการอนุมัติแล้ว', 'found_item_approved', 3, 1, '2026-09-19 16:43:25'),
(4, 6, 'ประกาศได้รับการอนุมัติ', 'ประกาศของที่พบ “สุนัขนั่งเส้า” ได้รับการอนุมัติแล้ว', 'found_item_approved', 2, 1, '2026-09-19 16:43:39'),
(5, 4, 'มีประกาศของหายใหม่', 'มีประกาศของหาย \"แมวนักกิน\" รอการตรวจสอบ', 'staff_lost_item_pending', 3, 1, '2026-09-20 03:08:14'),
(6, 6, 'ประกาศได้รับการอนุมัติ', 'ประกาศของหาย “แมวนักกิน” ได้รับการอนุมัติแล้ว', 'lost_item_approved', 3, 1, '2026-09-20 03:08:51'),
(7, 4, 'มีประกาศของพบใหม่', 'มีประกาศของพบ \"แมวสีขาวดำ\" รอการตรวจสอบ', 'staff_found_item_pending', 4, 1, '2026-09-20 03:20:31'),
(8, 2, 'ประกาศได้รับการอนุมัติ', 'ประกาศของที่พบ “แมวสีขาวดำ” ได้รับการอนุมัติแล้ว', 'found_item_approved', 4, 1, '2026-09-20 03:20:56'),
(9, 4, 'มีประกาศของหายใหม่', 'มีประกาศของหาย \"แมวเป้า\" รอการตรวจสอบ', 'staff_lost_item_pending', 4, 1, '2026-09-20 03:39:46'),
(10, 2, 'ประกาศได้รับการอนุมัติ', 'ประกาศของหาย “แมวเป้า” ได้รับการอนุมัติแล้ว', 'lost_item_approved', 4, 1, '2026-09-20 03:40:10'),
(11, 2, 'พบรายการที่อาจเป็นของคุณ', 'Staff ตรวจพบว่าประกาศของพบ “แมวเป้า” อาจตรงกับของหาย “แมวเป้า” ของคุณ กดเพื่อดูรายละเอียดและส่งคำขอรับของคืนได้', 'match_confirmed', 3, 1, '2026-09-20 03:40:19'),
(12, 4, 'มีคำขอรับของคืนใหม่', 'มีคำขอรับของคืนใหม่สำหรับประกาศหมายเลข 3 รอการตรวจสอบ', 'staff_claim_pending', 2, 1, '2026-09-20 03:41:35'),
(13, 2, 'คำขอรับของคืนได้รับการอนุมัติ', 'Staff อนุมัติคำขอรับของคืนของคุณแล้ว กรุณารอการนัดคืนของ', 'claim_approved', 2, 1, '2026-09-20 03:42:20'),
(14, 2, 'มีนัดคืนของใหม่', 'Staff สร้างนัดคืนของวันที่ 2026-09-10 10:44 ที่ บ้านกุ๊กๆ', 'return_scheduled', 2, 1, '2026-09-20 03:45:13'),
(15, 4, 'ผู้ใช้ยืนยันรับของคืนแล้ว', 'ผู้ใช้ยืนยันการรับของคืนสำหรับรายการคืนหมายเลข 2 แล้ว', 'staff_return_confirmed', 2, 1, '2026-09-20 03:45:46'),
(16, 1, 'มีข้อร้องเรียนใหม่', 'มีข้อร้องเรียนใหม่: สีจืดเกินไป', 'complaint_created', 1, 0, '2026-09-20 06:18:12'),
(17, 6, 'อัปเดตสถานะการร้องเรียน', 'เรื่อง \"สีจืดเกินไป\" เปลี่ยนสถานะเป็น resolved', 'complaint_status_updated', 1, 1, '2026-09-20 06:18:51'),
(18, 1, 'มีประกาศของพบใหม่', 'มีประกาศของพบ \"สุนัข\" รอการตรวจสอบ', 'staff_found_item_pending', 5, 0, '2026-09-20 07:34:14'),
(19, 4, 'มีประกาศของพบใหม่', 'มีประกาศของพบ \"สุนัข\" รอการตรวจสอบ', 'staff_found_item_pending', 5, 1, '2026-09-20 07:34:14'),
(20, 6, 'ประกาศได้รับการอนุมัติ', 'ประกาศของที่พบ “สุนัข” ได้รับการอนุมัติแล้ว', 'found_item_approved', 5, 0, '2026-09-20 07:39:11'),
(21, 1, 'มีประกาศของหายใหม่', 'มีประกาศของหาย \"หมาเซา\" รอการตรวจสอบ', 'staff_lost_item_pending', 5, 0, '2026-09-20 07:42:42'),
(22, 4, 'มีประกาศของหายใหม่', 'มีประกาศของหาย \"หมาเซา\" รอการตรวจสอบ', 'staff_lost_item_pending', 5, 1, '2026-09-20 07:42:42'),
(23, 2, 'ประกาศได้รับการอนุมัติ', 'ประกาศของหาย “หมาเซา” ได้รับการอนุมัติแล้ว', 'lost_item_approved', 5, 1, '2026-09-20 07:43:14'),
(24, 2, 'พบรายการที่อาจเป็นของคุณ', 'Staff ตรวจพบว่าประกาศของพบ “สุนัข” อาจตรงกับของหาย “หมาเซา” ของคุณ กดเพื่อดูรายละเอียดและส่งคำขอรับของคืนได้', 'match_confirmed', 5, 1, '2026-09-20 07:43:37'),
(25, 1, 'มีคำขอรับของคืนใหม่', 'มีคำขอรับของคืนใหม่สำหรับประกาศหมายเลข 5 รอการตรวจสอบ', 'staff_claim_pending', 3, 0, '2026-09-20 07:44:54'),
(26, 4, 'มีคำขอรับของคืนใหม่', 'มีคำขอรับของคืนใหม่สำหรับประกาศหมายเลข 5 รอการตรวจสอบ', 'staff_claim_pending', 3, 0, '2026-09-20 07:44:54'),
(27, 2, 'คำขอรับของคืนได้รับการอนุมัติ', 'Staff อนุมัติคำขอรับของคืนของคุณแล้ว กรุณารอการนัดคืนของ', 'claim_approved', 3, 1, '2026-09-20 07:45:25'),
(28, 2, 'มีนัดคืนของใหม่', 'Staff สร้างนัดคืนของวันที่ 2026-09-06 20:45 ที่ มาลา', 'return_scheduled', 3, 1, '2026-09-20 07:45:54'),
(29, 1, 'ผู้ใช้ยืนยันรับของคืนแล้ว', 'ผู้ใช้ยืนยันการรับของคืนสำหรับรายการคืนหมายเลข 3 แล้ว', 'staff_return_confirmed', 3, 0, '2026-09-20 07:46:22'),
(30, 4, 'ผู้ใช้ยืนยันรับของคืนแล้ว', 'ผู้ใช้ยืนยันการรับของคืนสำหรับรายการคืนหมายเลข 3 แล้ว', 'staff_return_confirmed', 3, 0, '2026-09-20 07:46:22');

-- --------------------------------------------------------

--
-- Table structure for table `ownership_proofs`
--

CREATE TABLE `ownership_proofs` (
  `id` int(11) NOT NULL,
  `claim_id` int(11) NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ownership_proofs`
--

INSERT INTO `ownership_proofs` (`id`, `claim_id`, `file_path`, `description`, `status`, `reviewed_by`, `reviewed_at`, `created_at`) VALUES
(1, 1, '/image/1789831737441-1ddf0a6e6f0c.jpeg', NULL, 'approved', 4, '2026-09-19 22:37:39', '2026-09-19 15:28:57'),
(2, 2, '/image/1789875695470-1b36d8fec767.jpeg', NULL, 'approved', 4, '2026-09-20 10:42:20', '2026-09-20 03:41:35'),
(3, 3, '/image/1789890294974-18d6b658b7f7e4a134107211.jpg', NULL, 'approved', 4, '2026-09-20 14:45:25', '2026-09-20 07:44:54');

-- --------------------------------------------------------

--
-- Table structure for table `returns`
--

CREATE TABLE `returns` (
  `id` int(11) NOT NULL,
  `claim_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `return_date` datetime DEFAULT NULL,
  `return_location` varchar(255) DEFAULT NULL,
  `receiver_name` varchar(100) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `status` enum('scheduled','completed','cancelled') DEFAULT 'scheduled',
  `user_confirmed` tinyint(1) DEFAULT 0,
  `user_confirmed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `returns`
--

INSERT INTO `returns` (`id`, `claim_id`, `staff_id`, `return_date`, `return_location`, `receiver_name`, `note`, `status`, `user_confirmed`, `user_confirmed_at`, `created_at`) VALUES
(1, 1, 4, '2026-09-03 22:00:00', 'บ้านเอ๋เอ๋', 'PARICHAT JUNLOY', '', 'completed', 1, '2026-09-19 23:01:02', '2026-09-19 15:56:55'),
(2, 2, 4, '2026-09-10 10:44:00', 'บ้านกุ๊กๆ', 'Somchai Test', '', 'completed', 1, '2026-09-20 10:45:46', '2026-09-20 03:45:13'),
(3, 3, 4, '2026-09-06 20:45:00', 'มาลา', 'Somchai Test', '', 'completed', 1, '2026-09-20 14:46:22', '2026-09-20 07:45:54');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `created_at`) VALUES
(1, 'user', 'ผู้ใช้งานทั่วไป', '2026-09-14 12:06:50'),
(2, 'staff', 'เจ้าหน้าที่รับผิดชอบของหาย', '2026-09-14 12:06:50'),
(3, 'admin', 'ผู้ดูแลระบบ', '2026-09-14 12:06:50');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL DEFAULT 1,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `status` enum('active','suspended') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `name`, `email`, `password`, `phone`, `profile_image`, `status`, `created_at`, `updated_at`) VALUES
(1, 3, 'Test User', 'test@gmail.com', 'not-used', NULL, NULL, 'active', '2026-09-19 08:25:51', '2026-09-20 05:09:58'),
(2, 1, 'Somchai Test', 'somchai123@gmail.com', 'd7c66ca9f4d9da17615a0b0ef3b56037299bc419968bfde4c179f999aad62f64', NULL, NULL, 'active', '2026-09-19 09:03:35', '2026-09-19 09:03:35'),
(4, 2, 'ปาริ จันทร์ลอย', 'p.parichat310@gmail.com', '2be42b02171564ccd410ff49c4322f0616f7e3e2f8708ba7012164184aebf12d', NULL, NULL, 'active', '2026-09-19 09:29:05', '2026-09-19 15:36:03'),
(6, 1, 'PARICHAT', 'ployparichat306@gmail.com', '1971149799615a631823993d1cc434f24af3f3b4b0e1c9b32d9e6d5f43b297bc', '0834910946', '/image/1789876794345-620319600a72.jpeg', 'active', '2026-09-19 15:22:01', '2026-09-20 04:00:09');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_log_user` (`user_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `claims`
--
ALTER TABLE `claims`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_claim_found_item` (`found_item_id`),
  ADD KEY `fk_claim_user` (`user_id`),
  ADD KEY `fk_claim_staff` (`reviewed_by`);

--
-- Indexes for table `complaints`
--
ALTER TABLE `complaints`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_complaint_user` (`user_id`),
  ADD KEY `fk_complaint_lost` (`related_lost_item_id`),
  ADD KEY `fk_complaint_found` (`related_found_item_id`),
  ADD KEY `fk_complaint_staff` (`handled_by`);

--
-- Indexes for table `found_items`
--
ALTER TABLE `found_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_found_user` (`user_id`),
  ADD KEY `fk_found_category` (`category_id`),
  ADD KEY `fk_found_staff` (`approved_by`);

--
-- Indexes for table `found_item_images`
--
ALTER TABLE `found_item_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_found_item_images_item` (`found_item_id`);

--
-- Indexes for table `item_matches`
--
ALTER TABLE `item_matches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_item_match_pair` (`lost_item_id`,`found_item_id`),
  ADD KEY `idx_item_matches_status` (`status`),
  ADD KEY `idx_item_matches_reviewer` (`reviewed_by`),
  ADD KEY `fk_item_matches_found` (`found_item_id`);

--
-- Indexes for table `login_tokens`
--
ALTER TABLE `login_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `fk_login_token_user` (`user_id`);

--
-- Indexes for table `lost_items`
--
ALTER TABLE `lost_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_lost_user` (`user_id`),
  ADD KEY `fk_lost_category` (`category_id`),
  ADD KEY `fk_lost_staff` (`approved_by`);

--
-- Indexes for table `lost_item_images`
--
ALTER TABLE `lost_item_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_lost_item_images_item` (`lost_item_id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_message_sender` (`sender_id`),
  ADD KEY `fk_message_receiver` (`receiver_id`),
  ADD KEY `fk_message_lost` (`lost_item_id`),
  ADD KEY `fk_message_found` (`found_item_id`),
  ADD KEY `fk_message_claim` (`claim_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_notification_user` (`user_id`);

--
-- Indexes for table `ownership_proofs`
--
ALTER TABLE `ownership_proofs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_proof_claim` (`claim_id`),
  ADD KEY `fk_proof_staff` (`reviewed_by`);

--
-- Indexes for table `returns`
--
ALTER TABLE `returns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_return_claim` (`claim_id`),
  ADD KEY `fk_return_staff` (`staff_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_role` (`role_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `claims`
--
ALTER TABLE `claims`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `complaints`
--
ALTER TABLE `complaints`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `found_items`
--
ALTER TABLE `found_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `found_item_images`
--
ALTER TABLE `found_item_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `item_matches`
--
ALTER TABLE `item_matches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `login_tokens`
--
ALTER TABLE `login_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `lost_items`
--
ALTER TABLE `lost_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `lost_item_images`
--
ALTER TABLE `lost_item_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `ownership_proofs`
--
ALTER TABLE `ownership_proofs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `returns`
--
ALTER TABLE `returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `claims`
--
ALTER TABLE `claims`
  ADD CONSTRAINT `fk_claim_found_item` FOREIGN KEY (`found_item_id`) REFERENCES `found_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_claim_staff` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_claim_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `complaints`
--
ALTER TABLE `complaints`
  ADD CONSTRAINT `fk_complaint_found` FOREIGN KEY (`related_found_item_id`) REFERENCES `found_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_complaint_lost` FOREIGN KEY (`related_lost_item_id`) REFERENCES `lost_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_complaint_staff` FOREIGN KEY (`handled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_complaint_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `found_items`
--
ALTER TABLE `found_items`
  ADD CONSTRAINT `fk_found_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_found_staff` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_found_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `found_item_images`
--
ALTER TABLE `found_item_images`
  ADD CONSTRAINT `fk_found_item_images_item` FOREIGN KEY (`found_item_id`) REFERENCES `found_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `item_matches`
--
ALTER TABLE `item_matches`
  ADD CONSTRAINT `fk_item_matches_found` FOREIGN KEY (`found_item_id`) REFERENCES `found_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_item_matches_lost` FOREIGN KEY (`lost_item_id`) REFERENCES `lost_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_item_matches_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `login_tokens`
--
ALTER TABLE `login_tokens`
  ADD CONSTRAINT `fk_login_token_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lost_items`
--
ALTER TABLE `lost_items`
  ADD CONSTRAINT `fk_lost_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lost_staff` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_lost_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lost_item_images`
--
ALTER TABLE `lost_item_images`
  ADD CONSTRAINT `fk_lost_item_images_item` FOREIGN KEY (`lost_item_id`) REFERENCES `lost_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_message_claim` FOREIGN KEY (`claim_id`) REFERENCES `claims` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_message_found` FOREIGN KEY (`found_item_id`) REFERENCES `found_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_message_lost` FOREIGN KEY (`lost_item_id`) REFERENCES `lost_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_message_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ownership_proofs`
--
ALTER TABLE `ownership_proofs`
  ADD CONSTRAINT `fk_proof_claim` FOREIGN KEY (`claim_id`) REFERENCES `claims` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_proof_staff` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `returns`
--
ALTER TABLE `returns`
  ADD CONSTRAINT `fk_return_claim` FOREIGN KEY (`claim_id`) REFERENCES `claims` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_return_staff` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
