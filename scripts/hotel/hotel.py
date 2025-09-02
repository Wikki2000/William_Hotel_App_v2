from models import storage
from models.hotel_setting import HotelSetting

storage.new(HotelSetting())
storage.save()
storage.close()

print("Hotel setting added successfully")
