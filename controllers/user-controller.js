const { User, Thought } = require("../models");

const userController = {
  createUser({ body }, res) {
    User.create(body)
      .then((dbUserData) => res.json(dbUserData))
      .catch((err) => res.status(400).json(err));
  },

  // Get All Users
  getAllUser(req, res) {
    User.find({})
      // populate thoughts
      .populate({ path: "thoughts", select: "-__v" })
      // populate  friends
      .populate({ path: "friends", select: "-__v" })
      .select("-__v")
      .sort({ _id: -1 })
      .then((dbUserData) => res.json(dbUserData))
      .catch((err) => {
        console.log(err);
        res.status(500).json(err);
      });
  },

  // Get single user by ID
  getUserById({ params }, res) {
    User.findOne({ _id: params.id })
      .populate({ path: "thoughts", select: "-__v" })
      .populate({ path: "friends", select: "-__v" })
      .select("-__v")
      .then((dbUserData) => {
        if (!dbUserData) {
          res.status(404).json({ message: "No User with this ID!" });
          return;
        }
        res.json(dbUserData);
      })
      .catch((err) => {
        console.log(err);
        res.status(400).json(err);
      });
  },

  // Update User by ID
  updateUser({ params, body }, res) {
    User.findOneAndUpdate({ _id: params.id }, body, {
      new: true,
      runValidators: true,
    })
      .then((dbUserData) => {
        if (!dbUserData) {
          res.status(404).json({ message: "No User with this ID!" });
          return;
        }
        res.json(dbUserData);
      })
      .catch((err) => res.json(err));
  },

  //Delete user and users associated thoughts and remove from friends
  deleteUser({ params }, res) {
    User.findOneAndDelete({ _id: params.id })
      .then((dbUserData) => {
        if (!dbUserData) {
          res.status(404).json({ message: "No user found with this id." });
          return;
        }
        return dbUserData;
      })
      .then((dbUserData) => {
        User.updateMany(
          {
            _id: { $in: dbUserData.friends },
          },
          {
            $pull: { friends: params.userId },
          }
        ).then(() => {
          //deletes user's thought associated with id
          Thought.deleteMany({ username: dbUserData.username })
            .then(() => {
              res.json({ message: "User deleted" });
            })
            .catch((err) => {
              console.log(err);
              res.status(400).json(err);
            });
        });
      });
  },

  // add friend
  addFriend({ params }, res) {
    User.findOneAndUpdate(
      { _id: params.userId },
      { $push: { friends: params.friendId } },
      { new: true })
      .then((dbUserData) => {
        if (!dbUserData) {
          res.status(404).json({ message: "No User with this ID!" });
          return;
        }
        res.json(dbUserData);
      })
      .catch((err) => res.json(err));
  },

  // Delete Friend
  deleteFriend({ params }, res) {
    // update User instead of delete friend since we are removing friend from user
    User.findOneAndUpdate(
      { _id: params.userId },
      { $pull: { friends: params.friendId } },
      { new: true }
    )
      .populate({ path: "friends", select: "-__v" })
      .select("-__v")
      .then((dbUserData) => {
        if (!dbUserData) {
          res.status(404).json({ message: "No User with this ID!" });
          return;
        }
        res.json(dbUserData);
      })
      .catch((err) => res.status(400).json(err));
  },
};

module.exports = userController;
