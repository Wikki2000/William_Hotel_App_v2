# Hotel Management System

A comprehensive and lightweight hotel management solution built to streamline day-to-day operations such as sales tracking, stock management, staff performance monitoring, leave and loan requests, and role-based access control — all tailored for small to medium-sized hotels.

## Features

- **Sales Tracking**  
  Record daily transactions, manage bookings, and track revenue efficiently.

- **Stock Management**  
  Monitor inventory levels with alerts when supplies are low.

- **Staff Management**  
  - Performance indexing system to track and evaluate staff productivity  
  - Leave and loan request workflows with approval options for managers

- **Role-Based Access Control**  
  - Staff: View tasks, submit requests, and communicate with team  
  - Manager: Approve requests, oversee staff, manage stock and sales  
  - CEO: Full system control with analytics, reporting, and user management

- **Real-Time Communication**  
  In-app chat feature for seamless staff communication.

- **Receipt Printing**  
  On-demand printing of receipts after room bookings or order placements.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript, jQuery  
- **Backend:** Python (Flask)
- **Database:** (e.g., MySQL, MongoDB)  
- **Others:** SocketIo, Sqlachemy, 

## Live Demo

> Coming soon

## Some Screenshots
| ![](app/static/images/app_screnshot/Screenshot%20(4).png) | ![](app/static/images/app_screnshot/Screenshot%20(6).png) |
|------------------------------------------------------------|------------------------------------------------------------|
| ![](app/static/images/app_screnshot/Screenshot%20(5).png) | ![](app/static/images/app_screnshot/Screenshot%20(7).png) |
| ![](app/static/images/app_screnshot/Screenshot%20(8).png) | ![](app/static/images/app_screnshot/Screenshot%20(11).png) |

## How to Run Locally

1. Clone the repository:
  ```bash
   git clone https://github.com/yourusername/William_Hotel_App.git
   ```

2. Navigate into the project directory:
  ```bash
  cd William_Hotel_App
  ```

3. Set up the MySQL database:
 ```bash
  cat mysql/setup_mysql_dev_db.sql | sudo mysql -uroot -p
  ```

4. Run the application:
 ```bash
  python3 -m app.app
  ```
