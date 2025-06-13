from modules.autorization import autorizate

from modules.utils import get_relation_json, excel_to_dict, post_payload

from modules.makeFillSheet import makeFillSheet

from modules.makeProductsPayload import makeProductsPayload

from modules.makeOperatorsPayload import makeOperatorsPayload

from modules.makeLinksPayload import makeLinksPayload

import pandas as pd

import redis

import uuid

import time

import json

import requests

from io import BytesIO
from openpyxl import Workbook

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

import zipfile
import io

app = Flask(__name__)
CORS(app)

PROD = True

redis_host = 'redis-14815.c308.sa-east-1-1.ec2.redns.redis-cloud.com'
redis_port = 14815
redis_password = 'qSpLdoECDra4aXg15QxJvX6yShc3f2r4'

r = redis.Redis(
    host=redis_host,
    port=redis_port,
    password=redis_password
    # ssl=True
)

# cert_path = './1007383757.pfx'
# cert_psw = 'jlmarine2025'

@app.route('/consult-products', methods=['GET'])
def consultProducts():
    """
    Requisição JSON:
    {
        "raiz": "12345678"
    }
    Headers:
    - session-id: <uuid>
    """
    raiz = request.args.get('cpfCnpjRaiz')  # pega o parâmetro da query string

    print(raiz)

    if not raiz:
        return jsonify({'error': 'Missing "cpfCnpjRaiz" parameter'}), 400
    
    # Remove all non-digit characters and get the first 8 digits, left-padded with zeros if needed
    raiz = ''.join(filter(str.isdigit, raiz))[:8].zfill(8)
    session_id = request.headers.get('session-id')

    print(session_id)

    if not session_id:
        return jsonify({'error': 'Missing "session-id" header'}), 400

    tokens = r.get(session_id)
    if not tokens:
        return jsonify({"error": "Session expired or invalid"}), 401

    tokens = json.loads(tokens)

    set_token = tokens['set-token']
    csrf_token = tokens['x-csrf-token']

    root_url = 'https://portalunico.siscomex.gov.br' if PROD else 'https://val.portalunico.siscomex.gov.br'
    get_products_url = f'{root_url}/catp/api/ext/produto'

    headers = {
        "Content-Type": "application/json",
        "Authorization": set_token,
        "X-CSRF-Token": csrf_token
    }

    filters = {
        'cpfCnpjRaiz': raiz,
        'situacao': 0
    }

    try:
        print("Enviando requisição para obter produtos...")
        response = requests.get(get_products_url, headers=headers, params=filters)

        if response.status_code != 200:
            print(f"Erro ao enviar requisição: {response.status_code}")
            print("Detalhes:", response.text)
            exit()

        print("Requisição enviada com sucesso!")
        results = response.json()

    except requests.exceptions.RequestException as e:
        print(f"Erro na conexão: {e}")
        exit()

    all_attr_codes = sorted(set(
        attr.get('atributo')
        for product in results
        for attr in product.get('atributos', [])
    ))

    registros = []

    for product in results:
        codigos_interno = product.get('codigosInterno')
        print(codigos_interno)
        base = {
            'Código': product.get('codigo', ''),
            'NCM': product.get('ncm', ''),
            'Raiz': product.get('cpfCnpjRaiz', ''),
            'Descrição': product.get('descricao', ''),
            'Denominação': product.get('denominacao', ''),
            # 'Código Interno': product.get('codigosInterno', [''])[0],
            'Código Interno': codigos_interno[0] if isinstance(codigos_interno, list) and codigos_interno else '', 
            'Modalidade': product.get('modalidade', ''),
            'Situação': product.get('situacao', ''),
            'Versão': product.get('versao', '')
        }

        attr_dict = {attr.get('atributo'): attr.get('valor') for attr in product.get('atributos', [])}
        for code in all_attr_codes:
            base[code] = attr_dict.get(code, '')
        registros.append(base)

    df_produtos = pd.DataFrame(registros)
    relation_json = get_relation_json(prod=PROD)
    final_wb = makeFillSheet(df_produtos, relation_json)
    # Salvar em memória
    output = BytesIO()
    final_wb.save(output)
    output.seek(0)

    filename = f'products_{raiz}.xlsx'

    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )

@app.route('/consult-operators', methods=['GET'])
def consultOperators():
    """
    Requisição JSON:
    {
        "raiz": "12345678"
    }
    Headers:
    - session-id: <uuid>
    """
    raiz = request.args.get('cpfCnpjRaiz')  # pega o parâmetro da query string

    print(raiz)

    if not raiz:
        return jsonify({'error': 'Missing "cpfCnpjRaiz" parameter'}), 400
    
    # Remove all non-digit characters and get the first 8 digits, left-padded with zeros if needed
    raiz = ''.join(filter(str.isdigit, raiz))[:8].zfill(8)
    session_id = request.headers.get('session-id')

    print(session_id)

    if not session_id:
        return jsonify({'error': 'Missing "session-id" header'}), 400

    tokens = r.get(session_id)
    if not tokens:
        return jsonify({"error": "Session expired or invalid"}), 401

    tokens = json.loads(tokens)

    set_token = tokens['set-token']
    csrf_token = tokens['x-csrf-token']

    root_url = 'https://portalunico.siscomex.gov.br' if PROD else 'https://val.portalunico.siscomex.gov.br'
    get_oe_url = f'{root_url}/catp/api/ext/operador-estrangeiro'

    headers = {
        "Content-Type": "application/json",
        "Authorization": set_token,
        "X-CSRF-Token": csrf_token
    }

    filters = {
        'cpfCnpjRaiz': raiz,
        'situacao': 0
    }

    try:
        print("Enviando requisição para obter operadores estrangeiros...")
        response = requests.get(get_oe_url, headers=headers, params=filters)

        if response.status_code != 200:
            print(f"Erro ao enviar requisição: {response.status_code}")
            print("Detalhes:", response.text)
            exit()

        print("Requisição enviada com sucesso!")
        results = response.json()

    except requests.exceptions.RequestException as e:
        print(f"Erro na conexão: {e}")
        exit()

    wb = Workbook()
    ws = wb.active
    ws.title = 'Operadores Estrangeiros'

    ws.append([
        'Código', 'Raiz', 'Nome', 'Situação',
        'Logradouro', 'Nome Cidade', 'Código País', 'Código Interno'
    ])

    for oe in results:
        ws.append([
            oe.get('codigo', ''),
            oe.get('cpfCnpjRaiz', ''),
            oe.get('nome', ''),
            oe.get('situacao', ''),
            oe.get('logradouro', ''),
            oe.get('nomeCidade', ''),
            oe.get('codigoPais', ''),
            oe.get('codigoInterno', '')
        ])
    # Salvar em memória
    output = BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f'operators_{raiz}.xlsx'

    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )

@app.route('/consult-links', methods=['GET'])
def consultLinks():
    """
    Exemplo de requisição:
    GET /consult-links?cpfCnpjRaiz=12345678
    Headers:
    - session-id: <uuid>
    """
    raiz = request.args.get('cpfCnpjRaiz')
    if not raiz:
        return jsonify({'error': 'Missing "cpfCnpjRaiz" parameter'}), 400

    raiz = ''.join(filter(str.isdigit, raiz))[:8].zfill(8)

    session_id = request.headers.get('session-id')
    if not session_id:
        return jsonify({'error': 'Missing "session-id" header'}), 400

    tokens = r.get(session_id)
    if not tokens:
        return jsonify({"error": "Session expired or invalid"}), 401

    tokens = json.loads(tokens)
    set_token = tokens['set-token']
    csrf_token = tokens['x-csrf-token']

    root_url = 'https://portalunico.siscomex.gov.br' if PROD else 'https://val.portalunico.siscomex.gov.br'
    url = f'{root_url}/catp/api/ext/fabricante/exportar/{raiz}'

    headers = {
        "Authorization": set_token,
        "X-CSRF-Token": csrf_token
    }

    try:
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return jsonify({'error': 'Erro ao baixar ZIP', 'status': response.status_code, 'details': response.text}), 500

        # Abrir ZIP em memória
        zip_file = zipfile.ZipFile(io.BytesIO(response.content))
        json_filename = next((f for f in zip_file.namelist() if f.endswith('.json')), None)
        if not json_filename:
            return jsonify({'error': 'Arquivo JSON não encontrado no ZIP'}), 500

        with zip_file.open(json_filename) as json_file:
            json_data = json.load(json_file)

    except Exception as e:
        return jsonify({'error': 'Erro inesperado', 'details': str(e)}), 500

    # Criar planilha com openpyxl
    wb = Workbook()
    ws = wb.active
    ws.title = 'Vínculos'

    # Cabeçalhos mais legíveis
    ws.append([
        'seq',
        'Código País',
        'Raíz',
        'Código Operador Estrangeiro',
        'Conhecido',
        'Código Produto',
        'Vincular'
    ])

    for item in json_data:
        ws.append([
            item.get('seq', ''),
            item.get('codigoPais', ''),
            item.get('cpfCnpjRaiz', ''),
            item.get('codigoOperadorEstrangeiro', ''),
            item.get('conhecido', ''),
            item.get('codigoProduto', ''),
            item.get('vincular', '')
        ])

    output = BytesIO()
    wb.save(output)
    output.seek(0)

    filename = f'vinculos_{raiz}.xlsx'

    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name=filename
    )



@app.route('/make-sheet', methods=['POST'])
def makeSheet():
    # Verifica se a requisição contém o arquivo
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']

    # Verifica se o arquivo não foi enviado vazio
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    df = pd.read_excel(file)
    
    relation_json = get_relation_json(prod=PROD)

    wb = makeFillSheet(df, relation_json)

    file_stream = BytesIO()
    wb.save(file_stream)
    file_stream.seek(0)

    return send_file(
        file_stream,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='fill_sheet.xlsx'
    )

@app.route('/products-payload', methods=['POST'])
def productsPayload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    df = pd.read_excel(file)

    products = excel_to_dict(df)
    
    relation_json = get_relation_json(prod=PROD)

    payload, errors = makeProductsPayload(products, relation_json)

    print(errors)
    if len(errors) > 0:
        return jsonify(errors), 422
    else:
        return jsonify(payload), 200
    
@app.route('/operators-payload', methods=['POST'])
def operatorsPayload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    df = pd.read_excel(file)

    payload, errors = makeOperatorsPayload(df)

    if len(errors) > 0:
        return jsonify(errors), 422
    else:
        return jsonify(payload), 200
    
@app.route('/links-payload', methods=['POST'])
def linksPayload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    df = pd.read_excel(file)

    payload, errors = makeLinksPayload(df)

    if len(errors) > 0:
        return jsonify(errors), 422
    else:
        return jsonify(payload), 200

@app.route('/post-products', methods=['POST'])
def postProducts():
    session_id = request.headers['session-id']
    payload = request.json['payload']

    tokens = r.get(session_id)

    if tokens:
        tokens = json.loads(tokens)
    else:
        return jsonify({"error": "Session expired or invalid"}), 401

    url_path = '/catp/api/ext/produto'

    headers = {
        "Content-Type": "application/json",
        "Authorization": tokens['set-token'],
        "X-CSRF-Token": tokens['x-csrf-token']
    }

    response = post_payload(url_path=url_path, headers=headers, payload=payload, chunk_size=100, prod=PROD)

    return jsonify(response)

@app.route('/post-operators', methods=['POST'])
def postOperators():
    session_id = request.headers['session-id']
    payload = request.json['payload']

    tokens = r.get(session_id)

    if tokens:
        tokens = json.loads(tokens)
    else:
        return jsonify({"error": "Session expired or invalid"}), 401

    url_path = '/catp/api/ext/operador-estrangeiro'

    headers = {
        "Content-Type": "application/json",
        "Authorization": tokens['set-token'],
        "X-CSRF-Token": tokens['x-csrf-token']
    }

    response = post_payload(url_path=url_path, headers=headers, payload=payload, chunk_size=100, prod=PROD)

    return jsonify(response)

@app.route('/post-links', methods=['POST'])
def postLinks():
    session_id = request.headers['session-id']
    payload = request.json['payload']

    tokens = r.get(session_id)

    if tokens:
        tokens = json.loads(tokens)
    else:
        return jsonify({"error": "Session expired or invalid"}), 401

    url_path = '/catp/api/ext/fabricante'

    headers = {
        "Content-Type": "application/json",
        "Authorization": tokens['set-token'],
        "X-CSRF-Token": tokens['x-csrf-token']
    }

    response = post_payload(url_path=url_path, headers=headers, payload=payload, chunk_size=100, prod=PROD)

    return jsonify(response)


@app.route('/authenticate-certificate', methods=['POST'])
def authenticateCertificate():

    certificate_file = request.files['file']
    certificate_password = request.headers['password']

    print(certificate_password)
    
    auth_response = autorizate(certificate_file, certificate_password, prod=PROD)

    print(auth_response)

    if auth_response.get('status') == 200:

        session_id = str(uuid.uuid4())

        tokens = {
            'x-csrf-token': auth_response['csrf-token'],
            'set-token': auth_response['set-token']
        }

        exp_seconds = int(auth_response['exp']) / 1000
        now_seconds = time.time()
        exp_time = int(exp_seconds - now_seconds)

        r.set(session_id, json.dumps(tokens), ex=exp_time)

        return jsonify({"session-id": session_id}), auth_response['status']
    else:
        return jsonify(auth_response), auth_response['status']

if __name__ == '__main__':
    app.run()