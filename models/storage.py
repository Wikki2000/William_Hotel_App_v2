#!/usr/bin/python3
"""This module models the storage of the authentication API"""
from sqlalchemy import create_engine, func, or_, update, cast, Date, and_, inspect
from sqlalchemy.orm import sessionmaker, scoped_session

from models.base_model import Base
from models.customer import Customer
from models.user import User
from models.order import Order
from models.room import Room
from models.booking import Booking
from models.drink import Drink
from models.food import Food
from models.order_item import OrderItem
from models.loan_request import LoanRequest
from models.leave_request import LeaveRequest
from models.group_message import GroupMessage
from models.private_message import PrivateMessage
from models.group import Group
from models.vendor import Vendor
from models.maintenance import Maintenance
from models.expenditure import Expenditure
from models.daily_expenditure_sum import DailyExpenditureSum
from models.receipt import Receipt
from models.game import Game
from models.laundry import Laundry
from models.sale import Sale

from urllib.parse import quote_plus
from dotenv import load_dotenv
from os import getenv
from typing import Type, Any, List

load_dotenv()


class Storage:
    """ Defines storage model using SQLAlchemy. """
    __session = None
    __engine = None

    def __init__(self):
        """ Create session engine to interact with database. """
        env_type = getenv('WILLIAM_COURT_ENV')

        username = (
            getenv('WILLIAM_COURT_TEST_USER')
            if env_type == 'test' else getenv('WILLIAM_COURT_DEV_USER')
        )

        password = (
            getenv('WILLIAM_COURT_TEST_PASSWORD')
            if env_type == 'test' else getenv('WILLIAM_COURT_DEV_PASSWORD') 
        )

        database = (
            getenv('WILLIAM_COURT_TEST_DATABASE')
            if env_type == 'test' else getenv('WILLIAM_COURT_DEV_DATABASE')
        )

        if not username or not password:
            error = "Environment variables must be set for database URL"
            raise ValueError(error)

        # URL encode the password to handle special characters
        encoded_password = quote_plus(password)

        url = f'mysql+mysqldb://{username}:{encoded_password}@127.0.0.1:3306/{database}'
        self.__engine = create_engine(url, pool_pre_ping=True)

        # Drop all table if it is test env.
        """
        if env_type == 'test':
            Base.metadata.drop_all(self.__engine)
        """

        Base.metadata.create_all(self.__engine)
        session_factory = sessionmaker(bind=self.__engine)
        self.__session = scoped_session(session_factory)
   
    @property
    def session(self):
        return self.__session

    def refresh(self, obj: object) -> object:
        """Refresh to get current state
        """
        return self.__session.refresh(obj)

    def all(self, cls=None):
        """Retrieve data from database."""
        new_dict = {}

        rows = self.__session.query(cls).all()
        for row in rows:
            key = f"{row.__class__.__name__}.{row.id}"
            new_dict.update({key: row})
        return new_dict

    def new(self, obj):
        """ Add user object to session.new """
        self.__session.add(obj)

    def add_many(self, obj_list):
        """Add multiples object."""
        self.__session.add_all(obj_list)

    def rollback(self):
        """ Rollback a session on error. """
        self.__session.rollback()

    def get_by(self, cls, **kwargs):
        """Retrieve an instance with an arbituary fields/values.

        Args:
            cls (class) - The class to filter for an object.
            kwargs (dict) - Dict of fields and value to filter for object.

        Return: The object filter from database
        """
        obj = self.__session.query(cls).filter_by(**kwargs).first()
        return obj

    def all_get_by(self, cls, **kwargs):
        """Retrieve an instance with an arbituary fields/values.

        Args:
            cls (class) - The class to filter for an object.
            kwargs (dict) - Dict of fields and value to filter for object.

        Return: All the object filter from database
        """
        obj = self.__session.query(cls).filter_by(**kwargs).all()
        return obj

    def get_start_with(self, cls, field, prefix):
        mapper = inspect(cls)
        
        if field not in mapper.columns:
            msg = (
                f"Field {field} does not exist in {cls.__name__}"
            )
            raise ValueError(msg)
        column = getattr(cls, field)
        obj_list = self.__session.query(cls).filter(
            column.ilike(f"%{prefix}%")
        ).all()
        return obj_list

    def count_by(self, cls, **kwargs):
        """Count an instance with an arbituary fields/values.
        Args:
            cls (class) - The class to filter for an object.
            wargs (dict) - Dict of fields and value to count

        Return: The total count of object in class
        """
        total_count = self.__session.query(
                func.count(cls.id)
                ).filter_by(**kwargs).scalar()
        return total_count

    def get_by_date(self, cls, start_date, end_date, date_field, **kwargs):
        """
        Retrieve records from the database filtered by a specified date field.

        Args:
            cls: The model class to query.
            start_date: The start date for filtering.
            end_date: The end date for filtering.
            date_field: The name of the date field to filter by.

        Returns:
            List of filtered records.
        """
        try:
            # Get the column dynamically from the model class
            date_column = getattr(cls, date_field)
            obj = self.__session.query(cls).filter(
                and_(
                    cast(date_column, Date) >= start_date,
                    cast(date_column, Date) <= end_date
                    )
            )
            if kwargs:
                obj = obj.filter_by(**kwargs)
            return obj.all()

        except AttributeError:
            cls = cls.__name__
            print(f"Error: '{date_field}' is not a valid field for {cls}.")
            return []

        except Exception as e:
            print(f"Database query failed: {e}")
            return []

    def save(self):
        """ Commit change to database """
        self.__session.commit()

    def delete(self, obj):
        """ Delete an instance of a class. """
        self.__session.delete(obj)

    def delete_many(self, obj_list):
        """ Delete multiple instance of a class. """
        for obj in obj_list:
            if obj.__class__.__name__ == "Customer" and obj.is_guest:
                pass
            else:
                if obj:
                    self.__session.delete(obj)

    def close(self):
        """ Close database session. """
        self.__session.close()

    def get_by_double_field(
        self, model: Type, attr_val1: List, attr_val2: List
    ) -> List:
        """
        Filter a model using two field.

        :attr_val1 - List of attribute and value of 1st field.
        :attr_val2 - List of attribute and value of 2nd field.

        :rtype - List of the search result.
        """
        sender_id = getattr(model, attr_val1[0])
        receiver_id = getattr(model, attr_val2[0])
        result = (
                self.__session.query(model)
                .filter(
                    or_(
                        (sender_id == attr_val1[1]) & (receiver_id == attr_val2[1]),
                        (receiver_id == attr_val1[1]) & (sender_id == attr_val2[1])
                        )
                    )
                .all()
                )
        return result

    def get_grouped_items(self, item_type: str, start_date, end_date, terminal):
        """
        Group and sum quantities of ordered items (drink, food, game, laundry)
        between a date range, using `and_()` for filtering and casting created_at

         Args:
            db: SQLAlchemy Session.
            item_type: The type of item ("drink", "food", "game", "laundry").
            start_date: Start of date range (inclusive).
            end_date: End of date range (inclusive).

        Returns:
            List of tuples (item_id, total_qty).
        """

        item_mapping = {
            "drink": OrderItem.drink_id,
            "food": OrderItem.food_id,
            "game": OrderItem.game_id,
            "laundry": OrderItem.laundry_id,
        }

        if item_type not in item_mapping:
            raise ValueError("Invalid item type specified.")

        item_column = item_mapping[item_type]

        results = (
            self.__session.query(
                item_column, func.sum(OrderItem.amount),
                func.sum(OrderItem.qty_order)
            )
            .filter(
                and_(
                    item_column.isnot(None),
                    cast(OrderItem.created_at, Date) >= start_date.date(),
                    cast(OrderItem.created_at, Date) <= end_date.date(),
                    OrderItem.terminal == terminal
                )
            )
            .group_by(item_column)
            .all()
        )

        return results
