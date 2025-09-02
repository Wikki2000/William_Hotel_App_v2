from models import storage
from models.dev import Dev
from models.user import User

"""
email = input("Enter Admin Email: ")
username = input("Enter Admin Username (Optional): ")
password = input("Enter Admin Password: ")

dev = Dev(
    email=email, 
    username=username,
    password=password
)
dev.hash_password()
storage.new(dev)
"""

ceo = User(
    email="david@gmail.com",
    username="david",
    role="admin",
    first_name="David",
    last_name="Michael",
    password="12345",
    rank_number=100,
    portfolio="CEO",
)
ceo.hash_password()
storage.new(ceo)

storage.save()
storage.close()
print("Admin Added Successfully!")
