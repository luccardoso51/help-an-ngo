const connection = require("../database/connection");

module.exports = {
  async index(request, response) {
    const { page = 1 } = request.query; //se o parametro page n existir, por padrao ele sera 1

    const [count] = await connection("incidents").count(); //retornar o todos os campos da tabela, o numero de casos

    const incidents = await connection("incidents")
      .join("ongs", "ongs.id", "=", "incidents.ong_id") //relacionando dados de duas tabelas => comparacao "ongs.id", "=", "incidents.ong_id" => ongs.id === incidents.ong_id
      .limit(5) //limitar o retorno para 5 registros
      .offset((page - 1) * 5) //paginação
      .select([
        //selecionando oq vai ser retornado de cada tabela
        "incidents.*",
        "ongs.name",
        "ongs.whatsapp",
        "ongs.city",
        "ongs.uf"
      ]);

    response.header("X-Total-Count", count["count(*)"]); // retornar no header o numero total de casos

    return response.json(incidents);
  },

  async create(request, response) {
    const { title, description, value } = request.body;
    const ong_id = request.headers.authorization;

    const [id] = await connection("incidents").insert({
      title,
      description,
      value,
      ong_id
    });

    return response.json({ id });
  },

  async delete(request, response) {
    const { id } = request.params;
    const ong_id = request.headers.authorization;

    const incident = await connection("incidents")
      .where("id", id) //buscar incidente onde o id é o igual ao id do user
      .select("ong_id") // usar apenas essa coluna
      .first(); //retornar apenas um resultado

    if (incident.ong_id !== ong_id) {
      return response.status(401).json({ error: "Operation not permited" });
    }

    await connection("incidents")
      .where("id", id)
      .delete();

    return response.status(204).send();
  }
};
