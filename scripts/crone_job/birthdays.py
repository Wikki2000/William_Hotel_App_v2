#!/usr/bin/python3
from models.user import User
from models import storage
from datetime import datetime
from api.v1.views.utils import read_html_file, send_mail, write_to_file

users = [
    user for user in storage.all(User).values()
    if user.dob is not None
]
today_date = datetime.now().strftime("%m-%d")
email_file = "app/templates/email_notification/birthday.html"
for user in users:
    if user.dob.strftime("%m-%d") == today_date:
        print("happy birthday")
        name = f"{user.first_name} {user.last_name}"
        place_holder = {"staff_name": name}
        subject = "[William's Court Hotel] 🎉 Happy Birthday!"
        recipient = {"name": name, "email": user.email} 
        mail = read_html_file(email_file, place_holder)
        send_mail(mail, recipient, subject) 

content = "I execute"
write_to_file("cron_test.log", content)
