const { source, destinations } = require("./data");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const Cookie =
  "49e94fb5b5444c1344515e7958605bdc=9531a66e42c514c95b1f58c31dd6cf5b; sidenav-state=pinned; ci_session=uor5ttv9nio5kh2c5e3383khoep5uhsk";

// const TenMbUsers = destinations.filter((user) => user.package === 9);

const findEncryptedUserId = async (userId) => {
  try {
    const config = {
      method: "get",
      url: `https://lptel.giize.com/user/profile/${userId}/`,
      headers: {
        Cookie: Cookie,
      },
    };
    const resp = await axios.request(config);
    const $ = cheerio.load(resp.data);
    const encryptedUserId = $('input[name="userID"]').first().val();
    return encryptedUserId;
  } catch (err) {
    fs.appendFileSync("failed_users.log", `${userId}\n`);
    // console.log(`Error fetching encrypted user ID for ${userId}:`, err);
  }
};

const updateExpiry = async ({ package, expiry, userId }) => {
  try {
    const FormData = require("form-data");
    let data = new FormData();
    data.append("source_page", "user_all");
    data.append("userID", userId);
    data.append("package", String(package));
    data.append("custom_expiry_type", "2");
    data.append("custom_date", expiry);
    data.append("expirytime", "12:00:00");

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://lptel.giize.com/user/activation",
      headers: {
        Cookie: Cookie,
        ...data.getHeaders(),
      },
      data: data,
    };

    await axios.request(config);
  } catch (error) {
    fs.appendFileSync("failed_users.log", `${userId}\n`);
    // console.error(`Error updating expiry for user ${userId}:`, error);
  }
};
const process = async () => {
  for (let userToUpdate of destinations) {
    const userWithExpiry = source.find(
      (user) => userToUpdate.username === user.username
    );
    if (userWithExpiry) {
      const exipriry = userWithExpiry.expiry.split(" ")[0];

      if (new Date(exipriry) < new Date()) {
        fs.appendFileSync("skipped_users.log", `${userToUpdate.username}\n`);
        continue;
      }
      const encryptedUserId = await findEncryptedUserId(userToUpdate.id);
      console.log(encryptedUserId);
      await updateExpiry({
        package: userToUpdate.package,
        expiry: userWithExpiry.expiry.split(" ")[0],
        userId: encryptedUserId,
      });
    }
  }
};
process()
  .then(() => console.log("All users processed"))
  .catch(console.log);
