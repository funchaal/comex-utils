import requests

def consulta_portal_unico_link(lista_raizes, set_token=None, csrf_token=None, prod=False):
    root_url = 'https://portalunico.siscomex.gov.br' if prod else 'https://val.portalunico.siscomex.gov.br'
    url_operadores = f'{root_url}/catp/api/ext/operador-estrangeiro'

    headers = {
        "Content-Type": "application/json",
        "Authorization": set_token,
        "X-CSRF-Token": csrf_token
    }

    resultado_total = []

    for raiz in lista_raizes:
        filtros = {
            'cpfCnpjRaiz': raiz,
            'situacao': 0
        }
        try:
            print(f"Consultando operadores para raiz {raiz} ...")
            response = requests.get(url_operadores, headers=headers, params=filtros)
            if response.status_code == 200:
                dados = response.json()
                operadores = dados.get('content', []) if isinstance(dados, dict) else dados
                for op in operadores:
                    item = {
                        'cpfCnpjRaiz': op.get('cpfCnpjRaiz', '').strip(),
                        'codigoOperadorEstrangeiro': op.get('codigoOperadorEstrangeiro', '').strip(),
                        'codigoPais': op.get('codigoPais', '').strip()
                    }
                    if item['cpfCnpjRaiz'] and item['codigoOperadorEstrangeiro'] and item['codigoPais']:
                        resultado_total.append(item)
            else:
                print(f"Erro na consulta para {raiz}: Status {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Exceção ao consultar para {raiz}: {e}")

    return resultado_total


def fill_missing_codigo_pais(payload, operadores_portal_unico):
    mapa_operadores = {}
    for op in operadores_portal_unico:
        chave = (op.get('cpfCnpjRaiz', '').strip(), op.get('codigoOperadorEstrangeiro', '').strip())
        codigo_pais = op.get('codigoPais', '').strip()
        if codigo_pais:
            mapa_operadores[chave] = codigo_pais

    errors = []
    for item in payload:
        if not item.get('codigoPais'):
            chave = (item.get('cpfCnpjRaiz', '').strip(), item.get('codigoOperadorEstrangeiro', '').strip())
            if chave in mapa_operadores:
                item['codigoPais'] = mapa_operadores[chave]
            else:
                errors.append({
                    "seq": item['seq'],
                    "atributo": "codigoPais",
                    "erro": f"Não encontrado códigoPais para {chave}"
                })

    return payload, errors


def makeLinksPayload(links, set_token=None, csrf_token=None, prod=False):
    """
    Cria o payload a partir dos dados de entrada (links).
    Se código país estiver vazio, consulta o Portal Único para preencher.
    Retorna payload e lista de erros.
    """

    payload = []
    errors = []

    for i, item in enumerate(links, start=1):
        raiz = str(item.get('cpfCnpjRaiz', '')).strip()
        codigo_op_ext = str(item.get('codigoOperadorEstrangeiro', '')).strip()
        codigo_produto = item.get('codigoProduto')
        codigo_pais = str(item.get('codigoPais', '')).strip()
        conhecido = str(item.get('conhecido', '')).strip().lower()
        vincular = str(item.get('vincular', '')).strip().lower()
        cpf_fabricante = str(item.get('cpfCnpjFabricante', '')).strip()

        if not raiz:
            errors.append({"seq": i, "atributo": "cpfCnpjRaiz", "erro": "Obrigatório"})
        if not codigo_op_ext:
            errors.append({"seq": i, "atributo": "codigoOperadorEstrangeiro", "erro": "Obrigatório"})
        if codigo_produto is None or codigo_produto == '':
            errors.append({"seq": i, "atributo": "codigoProduto", "erro": "Obrigatório"})

        def to_bool(val):
            val = str(val).lower().replace('ã', 'a')
            if val == '' or val == 'sim':
                return True
            elif val == 'nao':
                return False
            else:
                return True

        conhecido_bool = to_bool(conhecido)
        vincular_bool = to_bool(vincular)

        obj = {
            "seq": i,
            "cpfCnpjRaiz": raiz,
            "codigoOperadorEstrangeiro": codigo_op_ext,
            "cpfCnpjFabricante": cpf_fabricante,
            "conhecido": conhecido_bool,
            "codigoProduto": codigo_produto,
            "vincular": vincular_bool,
            "codigoPais": codigo_pais or ""
        }

        payload.append(obj)

    # Se houver itens com codigoPais vazio, consulta Portal Único para preencher
    raizes_sem_codigo_pais = list(set(item['cpfCnpjRaiz'] for item in payload if not item['codigoPais']))
    if raizes_sem_codigo_pais:
        if not set_token or not csrf_token:
            errors.append({"erro": "Tokens de autenticação necessários para consulta no Portal Único."})
        else:
            operadores_consultados = consulta_portal_unico_link(
                raizes_sem_codigo_pais, set_token=set_token, csrf_token=csrf_token, prod=prod
            )
            payload, errors_codigo_pais = fill_missing_codigo_pais(payload, operadores_consultados)
            errors.extend(errors_codigo_pais)

    return payload, errors
